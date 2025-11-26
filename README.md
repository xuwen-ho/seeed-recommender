# Seeed Studio Product Recommender

A full-stack product recommendation system for Seeed Studio, featuring a Python backend powered by Microsoft's SAR (Smart Adaptive Recommendations) algorithm and a Next.js frontend simulator for testing recommendations.

## 📚 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Usage](#usage)
- [API Reference](#api-reference)
- [For Collaborators](#for-collaborators)
  - [Modifying the Recommendation Algorithm](#modifying-the-recommendation-algorithm)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)

---

## Overview

This recommendation system analyzes historical order data to suggest products that customers are likely to buy together. It uses collaborative filtering based on co-purchase patterns to generate personalized product recommendations.

**Key Features:**
- 🧠 SAR (Smart Adaptive Recommendations) algorithm from Microsoft Recommenders
- 🔍 Real-time product search via Typesense
- 🛒 Interactive recommendation simulator
- 📊 Time-decay weighting for recent purchases
- 🔐 Secure SSH tunnel for database access

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌─────────────────┐    ┌─────────────────────────────────────┐ │
│  │  Context Builder │    │         Recommendation Results      │ │
│  │  (Product Search)│    │         (Hydrated from Typesense)   │ │
│  └────────┬─────────┘    └─────────────────▲───────────────────┘ │
│           │                                │                     │
│           │ Typesense API                  │ Typesense API       │
│           ▼                                │                     │
│  ┌─────────────────────────────────────────┴───────────────────┐ │
│  │              Typesense (Product Search & Metadata)          │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ REST API (POST /recommend)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (FastAPI + Python)                  │
│  ┌─────────────────┐    ┌─────────────────────────────────────┐ │
│  │   API Endpoints  │◄──►│        SAR Recommendation Engine   │ │
│  │   (main.py)      │    │        (recommender_engine.py)     │ │
│  └─────────────────┘    └─────────────────────────────────────┘ │
│           ▲                                                      │
│           │ SSH Tunnel                                           │
│           ▼                                                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              MySQL Database (Order History)                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **Microsoft Recommenders** - SAR algorithm implementation
- **Pandas/NumPy** - Data processing
- **PyMySQL** - MySQL database connector
- **SSHTunnel** - Secure database access

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first styling
- **Typesense** - Product search engine

---

## Getting Started

### Prerequisites

- **Python 3.10+** (recommended: 3.11)
- **Node.js 18+** (recommended: 20 LTS)
- **npm** or **yarn**
- Access to the Seeed Studio MySQL database (via SSH)

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create a `.env` file** in the `backend` directory (see [Environment Variables](#environment-variables))

5. **Start the server:**
   ```bash
   uvicorn main:app --reload
   ```
   
   The API will be available at `http://127.0.0.1:8000`

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000/simulator](http://localhost:3000/simulator) to access the recommendation simulator.

---

## Usage

### Recommendation Simulator

1. Navigate to `http://localhost:3000/simulator`
2. Use the search box to find products (searches by name or SKU)
3. Add products to the "User Context" (simulating a shopping cart)
4. View AI-generated recommendations in the right panel

### API Testing

Test the recommendation endpoint directly:

```bash
curl -X POST "http://127.0.0.1:8000/recommend" \
  -H "Content-Type: application/json" \
  -d '{"skus": ["114992632", "114990407"], "top_k": 10}'
```

---

## API Reference

### Health Check
```
GET /health
```
Returns the server status and model training state.

### Get Recommendations
```
POST /recommend
```

**Request Body:**
```json
{
  "skus": ["SKU1", "SKU2"],
  "top_k": 10
}
```

**Response:**
```json
{
  "input": ["SKU1", "SKU2"],
  "recommendations": ["SKU3", "SKU4", "SKU5", ...]
}
```

---

## For Collaborators

### Modifying the Recommendation Algorithm

> **📍 Important for Supervisors and Algorithm Developers**
>
> The recommendation algorithm is implemented in a single file:
> 
> **`backend/recommender_engine.py`**

This file contains the `SAREngine` class which handles all recommendation logic. Here's what you can customize:

#### Key Configuration Parameters (Line ~30-38)

```python
self.model = SARSingleNode(
    col_user="Email",           # User identifier column
    col_item="MaterialNumber",  # Product SKU column
    col_rating="QTY",           # Implicit rating (quantity purchased)
    col_timestamp="BillDate",   # Purchase timestamp for time decay
    similarity_type="jaccard",  # Options: "jaccard", "lift", "cooccurrence"
    time_decay_coefficient=30,  # Days until 50% weight decay
    timedecay_formula=True,     # Enable time-based weighting
    normalize=True              # Normalize similarity scores
)
```

#### How to Change the Algorithm

1. **Change Similarity Metric:**
   - Modify `similarity_type` parameter
   - Options: `"jaccard"` (default), `"lift"`, `"cooccurrence"`

2. **Adjust Time Decay:**
   - `time_decay_coefficient`: Controls how quickly older purchases lose weight
   - Lower values = faster decay, higher values = slower decay
   - Set `timedecay_formula=False` to disable time decay entirely

3. **Use a Different Algorithm:**
   - Replace `SARSingleNode` with another algorithm from Microsoft Recommenders
   - Or implement your own class with `train()` and `get_item_similarity_scores()` methods

4. **Modify Scoring Logic:**
   - Edit `get_item_similarity_scores()` method to customize how recommendations are generated
   - Add filtering, business rules, or custom scoring

#### Testing Changes

After modifying the algorithm:

```bash
# Restart the backend server
uvicorn main:app --reload

# Check if model trained successfully
curl http://127.0.0.1:8000/health
```

---

## Project Structure

```
seeed-recommender/
├── backend/
│   ├── main.py                 # FastAPI server & endpoints
│   ├── recommender_engine.py   # 🔧 SAR algorithm (MODIFY THIS)
│   ├── sql_data_loader.py      # Database connection via SSH
│   └── requirements.txt        # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # Landing page
│   │   │   ├── layout.tsx          # Root layout
│   │   │   └── simulator/
│   │   │       └── page.tsx        # Recommendation simulator
│   │   ├── components/
│   │   │   └── simulator/
│   │   │       ├── ContextBuilder.tsx  # Product search & selection
│   │   │       ├── ProductChip.tsx     # Selected product tag
│   │   │       └── RecResults.tsx      # Recommendation display
│   │   └── lib/
│   │       └── typesense.ts        # Typesense client & queries
│   ├── package.json
│   └── ...config files
│
└── README.md                   # This file
```

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# SSH Tunnel Configuration
SSH_HOST=your-ssh-host.com
SSH_USER=your-ssh-username
SSH_PASSWORD=your-ssh-password

# Database Configuration
DB_HOST=database-host
DB_USER=db-username
DB_PASSWORD=db-password
DB_NAME=orders_db
```

---

## License

Internal use only - Seeed Studio

---

## Support

For questions or issues, contact the development team.
