import { jsPDF } from 'jspdf';

export const generateBusinessPDF = (resource) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = 20;

  // Helper to add text with wrapping
  const addText = (text, fontSize = 12, fontStyle = 'normal', color = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, maxWidth);
    
    lines.forEach(line => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += fontSize * 0.5;
    });
    yPosition += 5;
  };

  // Header with logo
  doc.setFillColor(124, 106, 239);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('ε', 15, 20);
  doc.setFontSize(18);
  doc.text('Epsilon Learning', 25, 20);
  
  yPosition = 40;

  // Title
  addText(resource.title, 18, 'bold', [124, 106, 239]);
  yPosition += 5;

  // Category badge
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, yPosition, 60, 8, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(resource.category.toUpperCase(), margin + 5, yPosition + 6);
  yPosition += 15;

  // Description
  if (resource.description) {
    addText(resource.description, 11, 'italic', [71, 85, 105]);
  }

  // Content sections based on category
  const content = getContentForCategory(resource.category);
  
  content.sections.forEach(section => {
    addText(section.title, 14, 'bold', [30, 41, 59]);
    section.paragraphs.forEach(para => {
      addText(para, 11, 'normal', [51, 65, 85]);
    });
    yPosition += 3;
  });

  // Key Takeaways box
  yPosition += 5;
  doc.setFillColor(243, 232, 255);
  const takeawaysHeight = 8 + content.takeaways.length * 6;
  doc.roundedRect(margin, yPosition, maxWidth, takeawaysHeight, 3, 3, 'F');
  yPosition += 6;
  addText('Key Takeaways:', 12, 'bold', [124, 106, 239]);
  content.takeaways.forEach(takeaway => {
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text('• ' + takeaway, margin + 5, yPosition);
    yPosition += 6;
  });
  yPosition += 10;

  // Sources
  addText('Sources & References:', 12, 'bold', [30, 41, 59]);
  content.sources.forEach((source, idx) => {
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const sourceText = `[${idx + 1}] ${source}`;
    const lines = doc.splitTextToSize(sourceText, maxWidth);
    lines.forEach(line => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 4;
    });
    yPosition += 2;
  });

  // Footer
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text('© 2026 Epsilon Learning - Business Education Resource', pageWidth / 2, pageHeight - 6, { align: 'center' });
  }

  doc.save(`${resource.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
};

const getContentForCategory = (category) => {
  const contents = {
    fundamentals: {
      sections: [
        {
          title: 'Introduction to Business Fundamentals',
          paragraphs: [
            'Business fundamentals form the foundation of successful entrepreneurship and corporate management. Understanding these core principles is essential for anyone looking to excel in the business world.',
            'The key components include organizational structure, business planning, operations management, and strategic decision-making. Each element plays a crucial role in determining a company\'s success trajectory.'
          ]
        },
        {
          title: 'Core Principles',
          paragraphs: [
            'Mission and Vision: Every successful business starts with a clear mission statement that defines its purpose and a vision that outlines its future aspirations. These guiding principles inform all strategic decisions.',
            'Value Proposition: Understanding what unique value your business offers to customers is fundamental. This differentiation drives customer acquisition and retention.',
            'Business Models: The framework for how a company creates, delivers, and captures value. Common models include B2B, B2C, subscription-based, and marketplace platforms.'
          ]
        },
        {
          title: 'Organizational Structure',
          paragraphs: [
            'Effective organizational structure aligns roles, responsibilities, and reporting relationships to achieve business objectives. Common structures include functional, divisional, matrix, and flat organizations.',
            'Leadership hierarchy, departmental organization, and communication channels must be designed to support efficient operations and strategic execution.'
          ]
        }
      ],
      takeaways: [
        'Clear mission and vision drive business direction',
        'Value proposition differentiates you from competitors',
        'Organizational structure impacts efficiency and culture',
        'Strategic planning is essential for long-term success'
      ],
      sources: [
        'Harvard Business Review - "The Fundamentals of Business" (2024)',
        'Investopedia - Business Fundamentals Guide',
        'MIT Sloan Management Review - Organizational Structure Best Practices',
        'McKinsey & Company - Strategic Planning Framework (2025)'
      ]
    },
    marketing: {
      sections: [
        {
          title: 'Marketing Strategy Essentials',
          paragraphs: [
            'Modern marketing requires a deep understanding of consumer behavior, digital channels, and data-driven decision making. Successful marketers blend creativity with analytics to drive business growth.',
            'The marketing mix (Product, Price, Place, Promotion) remains fundamental, though digital transformation has added new dimensions like personalization and omnichannel experiences.'
          ]
        },
        {
          title: 'Digital Marketing Landscape',
          paragraphs: [
            'Social Media Marketing: Platforms like Instagram, LinkedIn, and TikTok offer unprecedented access to target audiences. Successful campaigns require authentic content and community engagement.',
            'Content Marketing: Creating valuable content that attracts and retains customers. This includes blogs, videos, podcasts, and interactive experiences that provide genuine value.',
            'SEO and SEM: Optimizing for search engines ensures visibility when customers are actively looking for solutions. Combining organic and paid strategies maximizes reach.'
          ]
        },
        {
          title: 'Customer Segmentation',
          paragraphs: [
            'Understanding your target audience through demographic, psychographic, and behavioral segmentation enables personalized messaging and improved conversion rates.',
            'Creating detailed buyer personas helps align marketing efforts with customer needs, pain points, and decision-making processes.'
          ]
        }
      ],
      takeaways: [
        'Digital marketing requires both creativity and data analysis',
        'Customer segmentation enables personalized messaging',
        'Content marketing builds trust and authority',
        'Omnichannel strategies provide consistent experiences'
      ],
      sources: [
        'HubSpot - The Ultimate Guide to Marketing (2025)',
        'Google - Digital Marketing Fundamentals',
        'Neil Patel - Modern Marketing Strategies',
        'American Marketing Association - Best Practices Report (2024)'
      ]
    },
    finance: {
      sections: [
        {
          title: 'Financial Management Principles',
          paragraphs: [
            'Financial management is the strategic planning, organizing, directing, and controlling of financial activities. It involves applying management principles to financial resources to achieve organizational objectives.',
            'Key areas include financial planning and analysis, capital budgeting, working capital management, and financial reporting. Each area requires specific expertise and contributes to overall financial health.'
          ]
        },
        {
          title: 'Financial Statements',
          paragraphs: [
            'Balance Sheet: Shows assets, liabilities, and equity at a specific point in time. Understanding the balance sheet helps assess company solvency and financial position.',
            'Income Statement: Reports revenues, expenses, and profitability over a period. This statement reveals operational efficiency and earnings power.',
            'Cash Flow Statement: Tracks cash inflows and outflows from operating, investing, and financing activities. Cash flow is critical for business sustainability.'
          ]
        },
        {
          title: 'Financial Ratios and Analysis',
          paragraphs: [
            'Liquidity Ratios: Measure ability to meet short-term obligations (Current Ratio, Quick Ratio)',
            'Profitability Ratios: Assess earning power (ROI, Profit Margin, ROE)',
            'Leverage Ratios: Evaluate debt levels and financial risk (Debt-to-Equity, Interest Coverage)'
          ]
        }
      ],
      takeaways: [
        'Financial statements provide insight into business health',
        'Cash flow management is critical for survival',
        'Financial ratios enable performance comparison',
        'Strategic financial planning drives growth'
      ],
      sources: [
        'CFA Institute - Financial Analysis Fundamentals',
        'Corporate Finance Institute - Financial Modeling Guide',
        'Wall Street Journal - Finance Best Practices (2025)',
        'Deloitte - Financial Management Framework'
      ]
    },
    entrepreneurship: {
      sections: [
        {
          title: 'The Entrepreneurial Mindset',
          paragraphs: [
            'Entrepreneurship requires a unique combination of vision, resilience, and adaptability. Successful entrepreneurs identify opportunities, take calculated risks, and persist through challenges.',
            'The lean startup methodology emphasizes rapid experimentation, validated learning, and iterative product development to minimize risk and maximize market fit.'
          ]
        },
        {
          title: 'Business Planning',
          paragraphs: [
            'Executive Summary: Concise overview of business concept, market opportunity, and financial projections',
            'Market Analysis: Deep understanding of target customers, competition, and market dynamics',
            'Financial Projections: Realistic forecasts of revenue, expenses, and capital requirements',
            'Operations Plan: How the business will deliver products/services efficiently'
          ]
        },
        {
          title: 'Funding and Growth',
          paragraphs: [
            'Bootstrapping: Self-funding through personal savings and early revenue. Maintains control but limits growth speed.',
            'Angel Investors: High-net-worth individuals who provide capital and mentorship in exchange for equity.',
            'Venture Capital: Institutional investors who fund high-growth potential startups. Brings expertise but requires significant equity.'
          ]
        }
      ],
      takeaways: [
        'Validate your business idea before full investment',
        'Market research is essential for product-market fit',
        'Multiple funding options exist for different stages',
        'Resilience and adaptability are key success factors'
      ],
      sources: [
        'Y Combinator - Startup School Resources',
        'Harvard Business School - Entrepreneurship Guide (2025)',
        'Kauffman Foundation - Entrepreneurship Research',
        'Forbes - Small Business Success Stories'
      ]
    },
    leadership: {
      sections: [
        {
          title: 'Leadership Fundamentals',
          paragraphs: [
            'Effective leadership goes beyond management—it involves inspiring and empowering others to achieve shared goals. Great leaders combine emotional intelligence, strategic thinking, and authentic communication.',
            'Modern leadership requires adaptability, as remote work, diverse teams, and rapid change demand new approaches to motivation and engagement.'
          ]
        },
        {
          title: 'Leadership Styles',
          paragraphs: [
            'Transformational Leadership: Inspires change through vision and passion. Focuses on innovation and organizational transformation.',
            'Servant Leadership: Prioritizes the growth and well-being of team members. Builds trust through empathy and support.',
            'Situational Leadership: Adapts style based on context and team maturity. Flexibility is key to effectiveness.'
          ]
        },
        {
          title: 'Team Development',
          paragraphs: [
            'Building high-performing teams requires clear goals, psychological safety, and continuous development. Leaders must foster collaboration while enabling individual growth.',
            'Effective delegation, constructive feedback, and recognition programs drive engagement and performance. Creating a culture of accountability and learning sustains excellence.'
          ]
        }
      ],
      takeaways: [
        'Emotional intelligence is crucial for leadership success',
        'Adapt leadership style to situation and team needs',
        'Psychological safety enables innovation and risk-taking',
        'Continuous learning and development drive excellence'
      ],
      sources: [
        'Center for Creative Leadership - Leadership Research (2025)',
        'Simon Sinek - Start With Why: Leadership Principles',
        'Brené Brown - Dare to Lead: Leadership Framework',
        'Harvard Business Review - Leadership Best Practices'
      ]
    }
  };

  return contents[category] || contents.fundamentals;
};