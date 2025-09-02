# KisaanCredit: The Digital MRV Bridge for Indian Agriculture

<p align="center">
<img src="https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white" alt="Flutter Badge"/>
<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Badge"/>
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js Badge"/>
<img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB Badge"/>
<img src="https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white" alt="Solidity Badge"/>
<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python Badge"/>
</p>

## Offset Today, Sustain Tomorrow.

KisaanCredit is a full-stack 'Soil to Sale' ecosystem that digitizes and democratizes the carbon farming market for India's smallholder farmers. We combine a user-friendly mobile app with the immutable trust of blockchain and the scientific precision of AI-powered remote sensing to create a transparent, scalable, and profitable bridge between grassroots climate action and the global carbon economy.

## Video Demo - Click to play the video
[![Everything Is AWESOME](https://img.youtube.com/vi/StTqXEQ2l-Y/0.jpg)](https://www.youtube.com/watch?v=StTqXEQ2l-Y "Everything Is AWESOME")

## The Problem

The carbon market has enormous potential, but it has historically failed the very people who are the primary stewards of our land: smallholder farmers. They are locked out by four key problems:

- **Profitability:** Verification costs are too high, making it unprofitable for small plots.  
- **Data Quality:** Onboarding is complex, and getting consistent, accurate data from the field is difficult.  
- **Trust:** The market is opaque, with concerns about credit authenticity and double-counting.  
- **Management:** Overseeing hundreds of fragmented, individual projects is a logistical nightmare for FPOs and NGOs.  

## Our Unique Solution

Our platform integrates four innovations into a seamless ecosystem:

1. **Profitability — AI-Powered "Digital Assessor"**  
   Replaces expensive manual soil sampling with a low-cost, AI-driven model fusing satellite data (GEE, Bhuvan) with farmer-reported activities. Profitable even for single small plots.

2. **Onboarding & Data Quality — "Map, Motivate, Mentor"**  
   - 🗺️ **Map:** Simple onboarding lets farmers draw their land to get instant earnings estimates.  
   - 🏆 **Motivate:** Gamified logging with leaderboards and badges.  
   - 🤖 **Mentor:** Agentic RAG chatbot provides instant, context-aware support.  

3. **Trust & Fraud — Unbreakable "Digital Chain of Custody"**  
   CreditLedger.sol smart contract on a public blockchain ensures immutable, transparent, and auditable history for every credit.

4. **Fragmented Management — "Portfolio Command Center"**  
   Web dashboard aggregates all projects, allowing managers to verify farmer data efficiently before credits are minted.

## Technology Stack

| Component       | Technology |
|-----------------|------------|
| 📱 Mobile App   | Flutter, Dart, Vosk (Offline Hindi STT), Google STT/gTTS APIs, Image Recognition |
| 🌐 Web Client   | React, Vite, Tailwind CSS, Shadcn UI, Aadhaar service APIs |
| ⚙️ Backend      | Node.js, Express.js, MongoDB, JWT, Multer, Cloudinary |
| 🧠 AI/ML        | Python, FastAPI, XGBoost, Scikit-learn, RAG chatbot |
| 🔗 Blockchain   | Solidity, Hardhat, Ethers.js |
| 🛰️ GIS          | Google Earth Engine (GEE), ISRO's Bhuvan & Bhoonidhi platforms |


## Project Structure
```
KisaanCredit/
├── app/ # Flutter Mobile App
│ └── lib/
│ ├── assets/ # Vosk speech models
│ ├── pages/ # Screens (login, daily log, calculator)
│ └── main.dart # Entry point
│
├── blockchain/ # Smart Contracts
│ └── contracts/
│ ├── CreditLedger.sol
│
├── client/ # React Web Dashboard
│ └── src/
│ ├── components/ # Reusable UI
│ ├── pages/ # Project Pages
│ ├── lib/ # Helpers (Aadhaar, Auth)
│ └── App.jsx # Main Component
│
├── server/ # Node.js Backend
│ └── src/
│ ├── controllers/
│ ├── models/
│ ├── routes/
│ ├── services/ # GIS Integrations
│ └── app.js # Express setup
│
└── server-fast_api/ # Python AI/ML Microservice
└── app/
├── routes.py
└── services.py # RAG chatbot & XGBoost
```

## Getting Started

### Prerequisites

- Node.js & npm  
- Flutter SDK  
- Python & pip  
- Hardhat development environment  

### Installation

1. **Clone the repo**  
```bash
git clone https://github.com/rakheOmar/KisaanCredit.git
cd KisaanCredit
```

2. **Setup Node.js Server**
```
cd server
npm install
npm run dev
```

3. **Setup React Client**
```
cd ../client
npm install
npm run dev
```

4. **Setup Flutter App**
```
cd ../app
flutter pub get
flutter run
```

5. **Setup Python AI/ML Server**
```
cd ../server-fast_api
uv venv
.venv/Scripts/activate
uv pip install -r requirements.txt
uvicorn chatbot:app --reload --host 0.0.0.0 --port 5000
```


6. **Deploy Blockchain Contracts**
```
cd ../blockchain
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost
```

## Contributing

Fork the Project
- Create your Feature Branch (git checkout -b feature/AmazingFeature)
- Commit your Changes (git commit -m 'Add some AmazingFeature')
- Push to the Branch (git push origin feature/AmazingFeature)

## License
Distributed under the MIT License. See LICENSE for more information.

