import axios from "axios";
import { requireEnv } from "./env.server";
import logger from "./logger.server";

// Extract skills from CV text
export function extractSkillsFromCV(cvText: string): string[] {
  const skills: string[] = [];
  
  // Common technical skills patterns
  const technicalPatterns = [
    /\b(JavaScript|TypeScript|Python|Java|C\+\+|C#|Ruby|Go|Rust|PHP|Swift|Kotlin)\b/gi,
    /\b(React|Vue|Angular|Node\.js|Express|Django|Flask|Spring|Laravel|ASP\.NET)\b/gi,
    /\b(SQL|MySQL|PostgreSQL|MongoDB|Redis|DynamoDB|Elasticsearch)\b/gi,
    /\b(AWS|Azure|GCP|Docker|Kubernetes|Jenkins|CI\/CD)\b/gi,
    /\b(HTML|CSS|SASS|LESS|Webpack|Vite|Babel)\b/gi,
    /\b(Git|GitHub|GitLab|JIRA|Agile|Scrum)\b/gi,
  ];
  
  // Soft skills
  const softSkills = [
    "leadership", "management", "communication", "teamwork", "problem solving",
    "project management", "analytical", "strategic", "creative", "detail-oriented"
  ];
  
  // Extract technical skills
  technicalPatterns.forEach(pattern => {
    const matches = cvText.match(pattern);
    if (matches) {
      skills.push(...matches.map(m => m.toLowerCase()));
    }
  });
  
  // Extract soft skills
  softSkills.forEach(skill => {
    if (cvText.toLowerCase().includes(skill)) {
      skills.push(skill);
    }
  });
  
  // Extract job titles and roles
  const jobTitlePattern = /(?:worked|role|position|as|developer|engineer|manager|director|lead|senior|junior|associate)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi;
  const titleMatches = cvText.match(jobTitlePattern);
  if (titleMatches) {
    titleMatches.forEach(match => {
      const title = match.replace(/(?:worked|role|position|as|developer|engineer|manager|director|lead|senior|junior|associate)\s+/i, '').trim();
      if (title && title.length > 3) {
        skills.push(title.toLowerCase());
      }
    });
  }
  
  return [...new Set(skills)].slice(0, 10); // Return unique skills, max 10
}

// Generate job search query from CV and user preferences
export function generateJobSearchQuery(
  cvText: string,
  userPreferences?: {
    location?: string;
    industry?: string;
    jobTitle?: string;
    remote?: boolean;
  }
): string {
  const skills = extractSkillsFromCV(cvText);
  const topSkills = skills.slice(0, 5).join(" ");
  
  let query = topSkills;
  
  if (userPreferences?.jobTitle) {
    query = `${userPreferences.jobTitle} ${topSkills}`;
  } else if (userPreferences?.industry) {
    query = `${userPreferences.industry} ${topSkills}`;
  }
  
  if (userPreferences?.location && !userPreferences?.remote) {
    query += ` ${userPreferences.location}`;
  }
  
  if (userPreferences?.remote) {
    query += " remote";
  }
  
  return query.trim();
}

// Search for jobs using Google Custom Search API or SerpAPI
export async function searchJobs(
  query: string,
  location?: string,
  options?: {
    useSerpAPI?: boolean;
    resultsCount?: number;
  }
): Promise<{
  jobs: Array<{
    title: string;
    company: string;
    location: string;
    description: string;
    url: string;
    source: string;
  }>;
  searchQuery: string;
}> {
  const apiKey = process.env.SERPAPI_KEY || process.env.GOOGLE_SEARCH_API_KEY;
  const useSerpAPI = options?.useSerpAPI ?? !!process.env.SERPAPI_KEY;
  
  if (!apiKey) {
    logger.warn({ query, location }, 'No search API key configured. Using mock results.');
    return {
      jobs: generateMockJobResults(query),
      searchQuery: query,
    };
  }
  
  try {
    if (useSerpAPI) {
      return await searchWithSerpAPI(query, location, options);
    } else {
      return await searchWithGoogleCustomSearch(query, location, options);
    }
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error', query, location }, 'Error searching jobs');
    // Fallback to mock results
    return {
      jobs: generateMockJobResults(query),
      searchQuery: query,
    };
  }
}

// Search using SerpAPI
async function searchWithSerpAPI(
  query: string,
  location?: string,
  options?: { resultsCount?: number }
): Promise<{
  jobs: Array<{
    title: string;
    company: string;
    location: string;
    description: string;
    url: string;
    source: string;
  }>;
  searchQuery: string;
}> {
  const apiKey = requireEnv("SERPAPI_KEY");
  const numResults = options?.resultsCount || 10;
  
  const params = new URLSearchParams({
    api_key: apiKey,
    engine: "google_jobs",
    q: query,
    location: location || "United Kingdom",
    num: numResults.toString(),
  });
  
  const response = await axios.get(`https://serpapi.com/search.json?${params.toString()}`);
  
  const jobs = (response.data.jobs_results || []).map((job: any) => ({
    title: job.title || "Job Title",
    company: job.company_name || "Company",
    location: job.location || location || "Location not specified",
    description: job.description || job.snippet || "",
    url: job.apply_options?.[0]?.link || job.related_links?.[0]?.link || "#",
    source: "SerpAPI",
  }));
  
  return {
    jobs,
    searchQuery: query,
  };
}

// Search using Google Custom Search API
async function searchWithGoogleCustomSearch(
  query: string,
  location?: string,
  options?: { resultsCount?: number }
): Promise<{
  jobs: Array<{
    title: string;
    company: string;
    location: string;
    description: string;
    url: string;
    source: string;
  }>;
  searchQuery: string;
}> {
  const apiKey = requireEnv("GOOGLE_SEARCH_API_KEY");
  const searchEngineId = requireEnv("GOOGLE_SEARCH_ENGINE_ID");
  const numResults = options?.resultsCount || 10;
  
  const searchQuery = `${query} job${location ? ` ${location}` : ""}`;
  
  const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
    params: {
      key: apiKey,
      cx: searchEngineId,
      q: searchQuery,
      num: numResults,
    },
  });
  
  const jobs = (response.data.items || []).map((item: any) => {
    // Extract company and location from snippet if possible
    const snippet = item.snippet || "";
    const companyMatch = snippet.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(?:in|at|–|-)/);
    const company = companyMatch ? companyMatch[1] : "Company";
    
    return {
      title: item.title || "Job Title",
      company,
      location: location || "Location not specified",
      description: snippet,
      url: item.link || "#",
      source: "Google",
    };
  });
  
  return {
    jobs,
    searchQuery,
  };
}

// Generate mock job results when API is not available
function generateMockJobResults(query: string): Array<{
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: string;
}> {
  const skills = query.split(" ").slice(0, 3).join(" ");
  
  return [
    {
      title: `${skills.charAt(0).toUpperCase() + skills.slice(1)} Developer`,
      company: "Tech Innovations Ltd",
      location: "London, UK",
      description: `Looking for an experienced ${skills} developer to join our growing team. Remote work available.`,
      url: "https://example.com/jobs/1",
      source: "Mock Results",
    },
    {
      title: `Senior ${skills.charAt(0).toUpperCase() + skills.slice(1)} Engineer`,
      company: "Digital Solutions Inc",
      location: "Manchester, UK",
      description: `We're hiring a Senior ${skills} Engineer. Competitive salary and benefits package.`,
      url: "https://example.com/jobs/2",
      source: "Mock Results",
    },
    {
      title: `${skills.charAt(0).toUpperCase() + skills.slice(1)} Specialist`,
      company: "InnovateCo",
      location: "Remote",
      description: `Remote position for ${skills} specialist. Join a fully distributed team.`,
      url: "https://example.com/jobs/3",
      source: "Mock Results",
    },
  ];
}

// Format job search results for AI response
export function formatJobResultsForAI(jobs: Array<{
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: string;
}>): string {
  if (jobs.length === 0) {
    return "No jobs found for your search criteria. Try adjusting your search terms or location.";
  }
  
  let formatted = `I found ${jobs.length} job opportunity${jobs.length > 1 ? "ies" : "y"}:\n\n`;
  
  jobs.forEach((job, index) => {
    formatted += `${index + 1}. **${job.title}** at ${job.company}\n`;
    formatted += `   📍 ${job.location}\n`;
    formatted += `   ${job.description.substring(0, 150)}${job.description.length > 150 ? "..." : ""}\n`;
    formatted += `   🔗 Apply: ${job.url}\n\n`;
  });
  
  formatted += "\n💡 **Tips:**\n";
  formatted += "- Review each job description carefully\n";
  formatted += "- Tailor your CV to match job requirements\n";
  formatted += "- Check company websites for more details\n";
  formatted += "- Consider reaching out to hiring managers on LinkedIn\n";
  
  return formatted;
}


