export const GITHUB_TOKEN_KEY = "maria_github_token";
export const GITHUB_USER_KEY = "maria_github_username";

export function isGitHubConnected() {
  return !!localStorage.getItem(GITHUB_TOKEN_KEY);
}

export function getGitHubUsername() {
  return localStorage.getItem(GITHUB_USER_KEY);
}

export function connectGitHub() {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
  const redirectUri = `${window.location.origin}/#/dashboard/productividad`;
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user`;
  window.location.href = url;
}

export function disconnectGitHub() {
  localStorage.removeItem(GITHUB_TOKEN_KEY);
  localStorage.removeItem(GITHUB_USER_KEY);
  window.location.reload();
}

export async function handleGitHubCallback(code) {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_GITHUB_CLIENT_SECRET;
  
  try {
    const response = await fetch("https://corsproxy.io/?https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code
      })
    });
    
    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem(GITHUB_TOKEN_KEY, data.access_token);
      
      // Fetch username
      const userRes = await fetch("https://api.github.com/user", {
        headers: { "Authorization": `Bearer ${data.access_token}` }
      });
      const userData = await userRes.json();
      if (userData.login) {
        localStorage.setItem(GITHUB_USER_KEY, userData.login);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error("GitHub auth error:", error);
    return false;
  }
}

export async function fetchGitHubContributions(username) {
  try {
    // We use a public GraphQL proxy for the contributions heatmap if possible
    // Alternatively, just scrape the public SVG or use a public REST API.
    // The easiest public REST API for GitHub contributions:
    const res = await fetch(`https://github-contributions-api.jasonbarry.co/v1/year/${username}`);
    if (!res.ok) throw new Error("API failed");
    const data = await res.json();
    // data.contributions is array of { date: 'YYYY-MM-DD', count: N }
    
    // Map to our heatmap format
    // We need an array of objects: { date, count }
    // Sort by date ascending
    const sorted = (data.contributions || []).sort((a,b) => new Date(a.date) - new Date(b.date));
    
    // Get last 140 days
    const last140 = sorted.slice(-140);
    return last140;
  } catch (err) {
    console.error("Failed to fetch GitHub contributions:", err);
    return [];
  }
}
