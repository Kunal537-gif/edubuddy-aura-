from backend.database import get_connection, add_flashcard
from datetime import date, datetime, timedelta

CURATED_TOPICS = [
    {
        "id": "dp",
        "title": "Dynamic Programming",
        "subject": "Computer Science",
        "category": "Algorithms",
        "difficulty": "Hard",
        "icon": "⚡",
        "summary": "Break down complex recursive problems by storing past solutions to avoid duplicate work.",
        "tags": ["Optimization", "Recursion", "Memoization", "Tabulation"]
    },
    {
        "id": "transformers",
        "title": "Attention Mechanism in Transformers",
        "subject": "Computer Science",
        "category": "Artificial Intelligence",
        "difficulty": "Hard",
        "icon": "🤖",
        "summary": "How modern LLMs compute soft similarity spotlights between words via Query, Key, and Value vectors.",
        "tags": ["Deep Learning", "Softmax", "NLP", "Neural Networks"]
    },
    {
        "id": "quantum",
        "title": "Quantum Superposition & Entanglement",
        "subject": "Physics",
        "category": "Quantum Mechanics",
        "difficulty": "Very Hard",
        "icon": "🌌",
        "summary": "Particles existing in probabilistic wave states until measurement, and instantaneous non-local correlation.",
        "tags": ["Wavefunction", "Bloch Sphere", "Bell State", "Qubits"]
    },
    {
        "id": "fourier",
        "title": "Fourier Transform",
        "subject": "Mathematics",
        "category": "Applied Analysis",
        "difficulty": "Hard",
        "icon": "〰️",
        "summary": "Decompose any complex periodic or arbitrary wave into its constituent pure sine and cosine frequencies.",
        "tags": ["Frequency Domain", "Euler Identity", "Signal Processing", "FFT"]
    },
    {
        "id": "crispr",
        "title": "CRISPR-Cas9 Gene Editing",
        "subject": "Biology",
        "category": "Genetics & Biotechnology",
        "difficulty": "Medium",
        "icon": "🧬",
        "summary": "Bacterial immune defense repurposed into programmable RNA-guided molecular scissors for DNA.",
        "tags": ["Cas9", "PAM", "Double-Strand Break", "HDR", "gRNA"]
    },
    {
        "id": "supply_demand",
        "title": "Supply and Demand Equilibrium",
        "subject": "Economics",
        "category": "Microeconomics",
        "difficulty": "Medium",
        "icon": "📈",
        "summary": "Market self-clearing price coordination where consumer willingness-to-pay balances producer marginal cost.",
        "tags": ["Market Clearing", "Elasticity", "Surplus", "Shortage"]
    },
    {
        "id": "bayes",
        "title": "Bayes' Theorem & Conditional Probability",
        "subject": "Mathematics",
        "category": "Probability & Statistics",
        "difficulty": "Medium",
        "icon": "🎲",
        "summary": "How to rationally update prior beliefs when new empirical evidence arrives: P(A|B) = P(B|A)P(A)/P(B).",
        "tags": ["Priors", "Likelihood", "Posterior", "Inference"]
    },
    {
        "id": "relativity",
        "title": "Special Relativity & Time Dilation",
        "subject": "Physics",
        "category": "Modern Physics",
        "difficulty": "Hard",
        "icon": "⏳",
        "summary": "Why time ticks slower for fast-moving objects to keep the speed of light constant for all observers.",
        "tags": ["Lorentz Factor", "Spacetime", "Invariance", "Speed of Light"]
    }
]

def seed_initial_data():
    conn = get_connection()
    cursor = conn.cursor()

    # Check if mastery table has records
    cursor.execute("SELECT COUNT(*) as count FROM concept_mastery")
    if cursor.fetchone()["count"] == 0:
        now_str = datetime.now().isoformat()
        yesterday_str = (datetime.now() - timedelta(days=1)).isoformat()
        
        initial_concepts = [
            ("Dynamic Programming", "Computer Science", 85, 4, now_str),
            ("Attention Mechanism in Transformers", "Computer Science", 65, 2, now_str),
            ("Quantum Superposition & Entanglement", "Physics", 45, 2, yesterday_str),
            ("Fourier Transform", "Mathematics", 70, 3, yesterday_str),
            ("CRISPR-Cas9 Gene Editing", "Biology", 90, 5, now_str),
            ("Supply and Demand Equilibrium", "Economics", 80, 3, yesterday_str)
        ]
        
        for topic, subj, mastery, reviews, last_rev in initial_concepts:
            cursor.execute("""
            INSERT INTO concept_mastery (topic, subject, mastery_percent, times_reviewed, last_reviewed_at)
            VALUES (?, ?, ?, ?, ?)
            """, (topic, subj, mastery, reviews, last_rev))

    # Check if flashcards exist
    cursor.execute("SELECT COUNT(*) as count FROM flashcards")
    if cursor.fetchone()["count"] == 0:
        initial_cards = [
            ("Dynamic Programming", "Computer Science", "What two properties define a DP problem?", "1. Optimal Substructure\n2. Overlapping Subproblems", "Think OS: Optimal Substructure + Shared Subproblems"),
            ("Dynamic Programming", "Computer Science", "What is the key difference between Memoization and Tabulation?", "Memoization is Top-Down with recursion cache. Tabulation is Bottom-Up filling a table iteratively.", "Memo = On-demand; Table = Brick-by-brick"),
            ("Attention Mechanism in Transformers", "Computer Science", "What are the 3 vectors generated for each token in self-attention?", "Query (Q: what I seek), Key (K: what I hold), Value (V: the actual content).", "QKV: Question, Keycard, Value payload"),
            ("Attention Mechanism in Transformers", "Computer Science", "Why do we divide dot products by √d_k?", "To prevent very large dot products from causing vanishing gradients in the Softmax function.", "Scale down to keep gradients alive"),
            ("Quantum Superposition & Entanglement", "Physics", "Can quantum entanglement transmit classical data faster than light?", "No. The No-Communication Theorem proves measurement outcomes are intrinsically random.", "Random noise cannot carry a message"),
            ("Fourier Transform", "Mathematics", "What does the Fourier Transform do in simple terms?", "Converts a signal from the time domain (composite wave) into the frequency domain (pure sine waves).", "Smoothie into separate fruits"),
            ("CRISPR-Cas9 Gene Editing", "Biology", "What is PAM and why is it needed?", "Protospacer Adjacent Motif (5'-NGG-3'). A short DNA tag required for Cas9 to bind and unwind target DNA.", "PAM = Passcode to Allow Melting"),
            ("Supply and Demand Equilibrium", "Economics", "What occurs when price is held below the equilibrium level?", "A shortage: Quantity Demanded exceeds Quantity Supplied, causing lines and rationing.", "Low price = empty shelves")
        ]
        
        today_str = date.today().isoformat()
        for topic, subj, front, back, mnemonic in initial_cards:
            cursor.execute("""
            INSERT INTO flashcards (topic, subject, front, back, mnemonic, next_review_date)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (topic, subj, front, back, mnemonic, today_str))

    conn.commit()
    conn.close()
