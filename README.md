# LandAI Assistant

> AI-powered business intelligence platform for Oklahoma oil and gas land acquisition professionals

[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](YOUR_DEMO_URL)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18+-blue.svg)](https://reactjs.org/)

## 🎯 Overview

LandAI Assistant transforms the slow, manual process of lease evaluation into an instant, data-driven workflow by combining advanced document analysis with live market data. Built specifically for professionals in the Oklahoma oil and gas land acquisition industry, this full-stack AI platform serves as both a technical showcase and a direct proof-of-concept to solve real-world business challenges.

**[🚀 Live Demo](YOUR_DEMO_URL)**

## 📋 Table of Contents

- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Technical Highlights](#-technical-highlights)
- [Getting Started](#-getting-started)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Key Features

### 🤖 AI-Powered Lease Analysis

Upload any PDF lease document and receive an instant, comprehensive analysis covering:

- Key economic terms extraction
- Market comparison analysis
- Financial projections
- Risk assessment

### 📊 Live Market Data Integration

Real-time market context through integration with OKCountyRecords.com API:

- Automatic price-per-acre calculations
- Recent sales data for specified counties
- Market trend analysis

### 🎛️ "What-If" Scenario Modeling

Interactive negotiation sandbox allowing users to:

- Re-run analyses with custom market parameters
- Model different oil/gas price scenarios
- Compare financial outcomes instantly

### 📱 Modern, Responsive Design

- Professional chat interface
- Fully responsive across devices
- Intuitive user experience

### 🔒 Secure Authentication

Complete security infrastructure:

- JWT-based authentication
- Private document storage
- Protected user conversations

## 🛠️ Tech Stack

| Category            | Technology                                    |
| ------------------- | --------------------------------------------- |
| **Frontend**        | React, Vite, React Router, Axios, CSS Modules |
| **Backend**         | Node.js, Express.js                           |
| **Database**        | PostgreSQL                                    |
| **AI**              | Google Gemini API (gemini-1.5-flash)          |
| **File Processing** | Multer, PDF.js                                |
| **Authentication**  | JWT, bcryptjs                                 |
| **DevOps**          | node-pg-migrate for DB version control        |

## 🔧 Technical Highlights

### 1. Strategic Pivot: From Scraping to API

**Initial Plan**: Complex web scraper using Puppeteer to gather market data from OKCountyRecords.com.

**The Discovery**: Site offered an official (though undocumented) API.

**The Decision**: Pivoted to API integration for production stability.

**Rationale**: Demonstrates ability to choose the right tool for the job, prioritizing robustness over unnecessary complexity. Original scraper code remains in project history.

### 2. Two-Step AI Pipeline Architecture

**Step 1 - AI Extraction** (`lease-extractor.service.js`):

- "Dumb" extractor focused solely on data extraction
- Converts raw PDF text to structured JSON

**Step 2 - AI Analysis** (`lease-analyzer.service.js`):

- Sophisticated analysis using clean JSON + market data
- Generates comprehensive four-part reports

**Rationale**: Separation of concerns improves reliability and analysis quality.

### 3. Demo-Optimized Seed Data Strategy

**Challenge**: OCC website's robust anti-scraping measures made live data unreliable for demos.

**Solution**: Implemented "Operator Intelligence" using realistic seed data in `operator_activity` table.

**Rationale**: Pragmatic approach ensuring reliable demo experience while proving the concept.

## 📸 Screenshot

![LandAI Assistant Interface](screenshot.png)
_LandAI Assistant chat interface showing AI-powered lease analysis_

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL
- Google Gemini API key

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/LandAI_Assistant.git
   cd LandAI_Assistant
   ```

2. **Setup Backend**

   ```bash
   cd server
   npm install
   ```

3. **Environment Configuration**

   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL credentials and Google Gemini API key
   ```

4. **Database Setup**

   ```bash
   # Run migrations
   npm run migrate up

   # (Optional) Seed with sample data
   npm run seed
   ```

5. **Start Backend Server**

   ```bash
   npm run dev
   ```

6. **Setup Frontend**

   ```bash
   cd ../client
   npm install
   npm run dev
   ```

7. **Access Application**

   Open [http://localhost:5173](http://localhost:5173) in your browser.

### Environment Variables

Create a `.env` file in the server directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/landai_db

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Server Port
PORT=5000
```

## 🗺️ Roadmap

### V2 Features

- [ ] **Conversational Context**: AI memory for follow-up questions
- [ ] **Live Operator Intelligence**: Real-time OCC data scraping
- [ ] **Expanded "What-If" Analysis**: Editable lease terms
- [ ] **Market Intelligence Dashboard**: Data visualization suite

### Future Enhancements

- [ ] Multi-state support beyond Oklahoma
- [ ] Advanced reporting and export features
- [ ] Team collaboration tools
- [ ] Mobile app development

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Oklahoma County Records for providing market data access
- Google Gemini AI for powering the analysis engine
- The Oklahoma oil and gas land professional community for domain expertise

---

**Built with ❤️ for the Oklahoma oil and gas land acquisition community**
