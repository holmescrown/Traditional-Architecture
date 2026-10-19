const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

export async function fetchSceneConfig() {
  const response = await fetch(`${API_BASE}/api/config`, {
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`场景数据请求失败（HTTP ${response.status}）`);
  }

  return response.json();
}
