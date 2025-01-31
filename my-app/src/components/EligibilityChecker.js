import React, { useState } from 'react';
import './EligibilityChecker.css';
import { jsPDF } from "jspdf";

const DEFAULT_UNIVERSITIES = {
  USA: [
    { name: "Massachusetts Institute of Technology", web_pages: "https://www.mit.edu" },
    { name: "Stanford University", web_pages: "https://www.stanford.edu" },
    { name: "Harvard University", web_pages: "https://www.harvard.edu" }
  ],
  Canada: [
    { name: "University of Toronto", web_pages: "https://www.utoronto.ca" },
    { name: "University of British Columbia", web_pages: "https://www.ubc.ca" },
    { name: "McGill University", web_pages: "https://www.mcgill.ca" }
  ]
};

const EligibilityChecker = () => {
  const [formData, setFormData] = useState({
    cgpa: "",
    workExperience: "",
    englishScore: "",
    scoreType: "IELTS",
    country: ""
  });
  
  const [results, setResults] = useState({
    isEligible: null,
    universities: [],
    loading: false,
    error: null
  });

  const convertToIELTS = (score, type) => 
    type === "IELTS" ? parseFloat(score) : ((parseFloat(score) - 31) / 10).toFixed(1);

  const checkEligibility = () => {
    const { cgpa, workExperience, englishScore, scoreType, country } = formData;
    const ieltsEquivalent = convertToIELTS(englishScore, scoreType);
    
    let isEligible = false;
    let eligibilityDetails = [];

    if (country === "USA") {
      const criteria = [
        { met: parseFloat(cgpa) >= 3.0, text: "CGPA requirement (≥3.0)" },
        { met: ieltsEquivalent >= 6.5, text: "English proficiency requirement (≥6.5 IELTS)" },
        { met: parseFloat(workExperience) >= 1, text: "Work experience requirement (≥1 year)" }
      ];
      
      isEligible = criteria.every(c => c.met);
      eligibilityDetails = criteria;
    } else if (country === "Canada") {
      const criteria = [
        { met: parseFloat(cgpa) >= 2.8, text: "CGPA requirement (≥2.8)" },
        { met: ieltsEquivalent >= 6.0, text: "English proficiency requirement (≥6.0 IELTS)" }
      ];
      
      isEligible = criteria.every(c => c.met);
      eligibilityDetails = criteria;
    }

    const universities = isEligible ? DEFAULT_UNIVERSITIES[country] || [] : [];

    setResults({
      isEligible,
      eligibilityDetails,
      universities,
      loading: false,
      error: null
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    checkEligibility();
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Study Abroad Eligibility Report", 20, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text([
      `CGPA: ${formData.cgpa}`,
      `Work Experience: ${formData.workExperience} years`,
      `${formData.scoreType} Score: ${formData.englishScore}`,
      `Preferred Country: ${formData.country}`,
      `\nEligibility Status: ${results.isEligible ? "ELIGIBLE" : "NOT ELIGIBLE"}`,
    ], 20, 40);

    if (results.eligibilityDetails) {
      doc.text("\nEligibility Criteria Details:", 20, 90);
      results.eligibilityDetails.forEach((detail, index) => {
        const status = detail.met ? "✓" : "✗";
        doc.text(`${status} ${detail.text}`, 20, 105 + (index * 10));
      });
    }

    if (results.isEligible && results.universities.length > 0) {
      const yStart = 105 + (results.eligibilityDetails.length * 10) + 20;
      doc.text("\nRecommended Universities:", 20, yStart);
      results.universities.forEach((uni, index) => {
        doc.text(`${index + 1}. ${uni.name}`, 20, yStart + 15 + (index * 10));
      });
    }

    doc.setFontSize(10);
    const today = new Date().toLocaleDateString();
    doc.text(`Report generated on ${today}`, 20, doc.internal.pageSize.height - 20);

    doc.save("eligibility-report.pdf");
  };

  return (
    <div className="eligibility-container">
      <h2 className="eligibility-title">Study Abroad Eligibility Checker</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>CGPA (0-5)</label>
            <input
              type="number"
              name="cgpa"
              step="0.01"
              min="0"
              max="5"
              required
              value={formData.cgpa}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>Work Experience (years)</label>
            <input
              type="number"
              name="workExperience"
              min="0"
              required
              value={formData.workExperience}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label>English Score</label>
            <div className="input-group">
              <input
                type="number"
                name="englishScore"
                step="0.5"
                required
                value={formData.englishScore}
                onChange={handleInputChange}
              />
              <select
                name="scoreType"
                value={formData.scoreType}
                onChange={handleInputChange}
                className="score-type-select"
              >
                <option value="IELTS">IELTS</option>
                <option value="TOEFL">TOEFL</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Country</label>
            <select
              name="country"
              required
              value={formData.country}
              onChange={handleInputChange}
            >
              <option value="">Select Country</option>
              <option value="USA">USA</option>
              <option value="Canada">Canada</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="submit-button"
        >
          Check Eligibility
        </button>
      </form>

      {results.isEligible !== null && (
        <div className="results-container">
          <div className={`status-message ${results.isEligible ? 'eligible' : 'not-eligible'}`}>
            {results.isEligible ? "You are eligible! ✅" : "Not eligible at this time ❌"}
          </div>

          {results.eligibilityDetails && (
            <div className="criteria-section">
              <h4>Eligibility Criteria:</h4>
              <ul className="criteria-list">
                {results.eligibilityDetails.map((detail, index) => (
                  <li
                    key={index}
                    className={`criteria-item ${detail.met ? 'success' : 'failure'}`}
                  >
                    {detail.text} {detail.met ? "✓" : "✗"}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {results.isEligible && results.universities.length > 0 && (
            <div className="universities-section">
              <h4>Recommended Universities:</h4>
              <ul className="university-list">
                {results.universities.map((uni, index) => (
                  <li key={index} className="university-item">
                    {uni.name}
                    {uni.web_pages && (
                      <a
                        href={uni.web_pages}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="university-link"
                      >
                        Visit Website
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button 
            onClick={downloadPDF} 
            className="download-button"
          >
            Download Report (PDF) 📄
          </button>
        </div>
      )}
    </div>
  );
};

export default EligibilityChecker;