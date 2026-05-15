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
  const token = localStorage.getItem(GITHUB_TOKEN_KEY);
  if (!token) return [];
  
  const query = `
    query($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
        }
      }
    }
  `;
  
  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query, variables: { username } })
    });
    
    if (!res.ok) throw new Error("GraphQL fetch failed");
    
    const { data, errors } = await res.json();
    if (errors) {
      console.error("GraphQL errors:", errors);
      return [];
    }
    
    const weeks = data?.user?.contributionsCollection?.contributionCalendar?.weeks || [];
    let days = [];
    weeks.forEach(week => {
      week.contributionDays.forEach(day => {
        days.push({ date: day.date.split('T')[0], count: day.contributionCount });
      });
    });
    
    // Sort by date ascending
    days = days.sort((a,b) => new Date(a.date) - new Date(b.date));
    return days.slice(-140);
  } catch (err) {
    console.error("Failed to fetch GitHub contributions via GraphQL:", err);
    return [];
  }
}
