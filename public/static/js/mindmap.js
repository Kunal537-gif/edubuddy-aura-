// Interactive Knowledge Graph Canvas Controller
let graphData = { nodes: [], links: [] };
let graphCanvas = null;
let graphCtx = null;
let graphAnimId = null;
let isDraggingNode = null;
let mousePos = { x: 0, y: 0 };
let hoveredNode = null;

async function loadConceptMap(topic = null) {
  try {
    const data = await api.getConceptMap(topic);
    graphData = data;
    initGraphSimulation();
  } catch (e) {
    console.error('Failed to load concept map:', e);
  }
}

function initGraphSimulation() {
  graphCanvas = document.getElementById('knowledgeGraphCanvas');
  if (!graphCanvas) return;

  // Set high DPI canvas resolution
  const rect = graphCanvas.getBoundingClientRect();
  graphCanvas.width = rect.width;
  graphCanvas.height = rect.height;
  graphCtx = graphCanvas.getContext('2d');

  // Randomize initial node positions around center
  const cx = graphCanvas.width / 2;
  const cy = graphCanvas.height / 2;

  graphData.nodes.forEach((node, i) => {
    const angle = (i / graphData.nodes.length) * Math.PI * 2;
    const dist = node.group === 'domain' || node.group === 'core' ? 60 : 160 + (i % 3) * 30;
    node.x = cx + Math.cos(angle) * dist;
    node.y = cy + Math.sin(angle) * dist;
    node.vx = 0;
    node.vy = 0;
  });

  // Attach mouse listeners
  graphCanvas.onmousedown = handleGraphMouseDown;
  window.onmousemove = handleGraphMouseMove;
  window.onmouseup = handleGraphMouseUp;
  graphCanvas.onclick = handleGraphClick;

  if (graphAnimId) cancelAnimationFrame(graphAnimId);
  animateGraph();
}

function animateGraph() {
  updateGraphPhysics();
  drawGraph();
  graphAnimId = requestAnimationFrame(animateGraph);
}

function updateGraphPhysics() {
  const cx = graphCanvas.width / 2;
  const cy = graphCanvas.height / 2;

  // 1. Center gravity pull
  graphData.nodes.forEach(node => {
    node.vx += (cx - node.x) * 0.001;
    node.vy += (cy - node.y) * 0.001;
  });

  // 2. Node repulsion (Coulomb's Law)
  for (let i = 0; i < graphData.nodes.length; i++) {
    for (let j = i + 1; j < graphData.nodes.length; j++) {
      const n1 = graphData.nodes[i];
      const n2 = graphData.nodes[j];
      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      if (dist < 220) {
        const force = (220 - dist) / dist * 0.04;
        n1.vx -= dx * force;
        n1.vy -= dy * force;
        n2.vx += dx * force;
        n2.vy += dy * force;
      }
    }
  }

  // 3. Link spring attraction (Hooke's Law)
  graphData.links.forEach(link => {
    const sourceNode = graphData.nodes.find(n => n.id === link.source);
    const targetNode = graphData.nodes.find(n => n.id === link.target);
    if (sourceNode && targetNode) {
      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const targetDist = 120;
      const force = (dist - targetDist) * 0.008;
      sourceNode.vx += (dx / dist) * force;
      sourceNode.vy += (dy / dist) * force;
      targetNode.vx -= (dx / dist) * force;
      targetNode.vy -= (dy / dist) * force;
    }
  });

  // 4. Dampen and update positions
  graphData.nodes.forEach(node => {
    if (node === isDraggingNode) {
      node.x = mousePos.x;
      node.y = mousePos.y;
      node.vx = 0;
      node.vy = 0;
    } else {
      node.vx *= 0.88;
      node.vy *= 0.88;
      node.x += node.vx;
      node.y += node.vy;
    }
  });
}

function drawGraph() {
  if (!graphCtx) return;
  graphCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);

  // Draw links
  graphData.links.forEach(link => {
    const s = graphData.nodes.find(n => n.id === link.source);
    const t = graphData.nodes.find(n => n.id === link.target);
    if (s && t) {
      graphCtx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
      graphCtx.lineWidth = 1.5;
      graphCtx.beginPath();
      graphCtx.moveTo(s.x, s.y);
      graphCtx.lineTo(t.x, t.y);
      graphCtx.stroke();

      // Draw relation label
      if (link.relation) {
        const midX = (s.x + t.x) / 2;
        const midY = (s.y + t.y) / 2;
        graphCtx.fillStyle = '#64748b';
        graphCtx.font = '9px sans-serif';
        graphCtx.fillText(link.relation, midX - 10, midY - 4);
      }
    }
  });

  // Draw nodes
  graphData.nodes.forEach(node => {
    const isHovered = (hoveredNode === node);
    const r = (node.radius || 24) + (isHovered ? 4 : 0);

    // Node Outer Glow
    graphCtx.save();
    graphCtx.shadowColor = node.color || '#3b82f6';
    graphCtx.shadowBlur = isHovered ? 20 : 8;

    // Node Circle
    graphCtx.fillStyle = node.color || '#3b82f6';
    graphCtx.beginPath();
    graphCtx.arc(node.x, node.y, r, 0, Math.PI * 2);
    graphCtx.fill();
    graphCtx.restore();

    // Node Border
    graphCtx.strokeStyle = '#ffffff';
    graphCtx.lineWidth = isHovered ? 2.5 : 1.5;
    ctxDrawCircle(node.x, node.y, r);

    // Label Text
    graphCtx.fillStyle = '#f8fafc';
    graphCtx.font = `${node.group === 'domain' || node.group === 'core' ? 'bold 11px' : '10px'} sans-serif`;
    graphCtx.textAlign = 'center';
    graphCtx.fillText(node.label, node.x, node.y + r + 14);
  });
}

function ctxDrawCircle(x, y, r) {
  graphCtx.beginPath();
  graphCtx.arc(x, y, r, 0, Math.PI * 2);
  graphCtx.stroke();
}

function handleGraphMouseDown(e) {
  const rect = graphCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const hit = findNodeAt(x, y);
  if (hit) {
    isDraggingNode = hit;
  }
}

function handleGraphMouseMove(e) {
  if (!graphCanvas) return;
  const rect = graphCanvas.getBoundingClientRect();
  mousePos.x = e.clientX - rect.left;
  mousePos.y = e.clientY - rect.top;
  hoveredNode = findNodeAt(mousePos.x, mousePos.y);
  graphCanvas.style.cursor = hoveredNode ? 'pointer' : 'grab';
}

function handleGraphMouseUp() {
  isDraggingNode = null;
}

function handleGraphClick(e) {
  const rect = graphCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const hit = findNodeAt(x, y);
  if (hit && hit.label && hit.group !== 'domain') {
    // Jump to Simplifier for this concept!
    simplifyDirect(hit.label);
  }
}

function findNodeAt(x, y) {
  return graphData.nodes.find(node => {
    const dx = node.x - x;
    const dy = node.y - y;
    return Math.sqrt(dx * dx + dy * dy) <= (node.radius || 24);
  });
}

function resetGraphView() {
  initGraphSimulation();
}
