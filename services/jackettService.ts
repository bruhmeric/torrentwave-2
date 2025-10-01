import type { TorrentResult, Category } from '../types';

const handleFetchError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }
  return new Error('An unknown error occurred during fetch.');
};

export const fetchCategories = async (
  apiKey: string
): Promise<Category[]> => {
  // The URL is now a relative path, which will be handled by the Nginx reverse proxy.
  const url = `/api/api/v2.0/indexers/all/results/torznab/api?t=caps&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch categories with status: ${response.status}`);
    }
    const xmlString = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");
    
    const errorNode = xmlDoc.querySelector('error');
    if (errorNode) {
        const errorCode = errorNode.getAttribute('code');
        const errorDesc = errorNode.getAttribute('description');
        if (errorCode === '100') {
             throw new Error('Invalid API Key. Please check your Jackett settings.');
        }
        throw new Error(`Jackett API Error: ${errorDesc} (Code: ${errorCode})`);
    }

    const categoryNodes = xmlDoc.querySelectorAll('category');
    const categories: Category[] = [];

    categoryNodes.forEach(node => {
      const parentId = node.getAttribute('id');
      const parentName = node.getAttribute('name');
      if (parentId && parentName) {
        categories.push({ id: parentId, name: parentName });
        const subcatNodes = node.querySelectorAll('subcat');
        subcatNodes.forEach(subcatNode => {
          const subId = subcatNode.getAttribute('id');
          const subName = subcatNode.getAttribute('name');
          if (subId && subName) {
            categories.push({ id: subId, name: `${parentName} / ${subName}` });
          }
        });
      }
    });

    categories.sort((a, b) => a.name.localeCompare(b.name));
    return categories;
  } catch (error) {
    console.error('Failed to fetch or parse categories:', error);
    throw handleFetchError(error);
  }
};

// FIX: Add missing 'testJackettConnection' function.
// This function is imported by SettingsPanel.tsx but was not defined, causing a build error.
export const testJackettConnection = async (baseUrl: string, apiKey: string): Promise<void> => {
  if (!baseUrl || !apiKey) {
    throw new Error('Jackett URL and API Key must be provided.');
  }

  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const url = `${cleanBaseUrl}/api/v2.0/indexers/all/results/torznab/api?t=caps&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Connection test failed. Status: ${response.status}`);
    }

    const xmlString = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

    const errorNode = xmlDoc.querySelector('error');
    if (errorNode) {
      const code = errorNode.getAttribute('code');
      const description = errorNode.getAttribute('description');
      if (code === '100') {
        throw new Error('Invalid API Key.');
      }
      throw new Error(`Jackett API error: ${description} (Code: ${code})`);
    }
  } catch (error) {
    console.error('Failed to test Jackett connection:', error);
    if (error instanceof TypeError) {
      // This often happens with CORS or network issues
      throw new Error(
        'Network error or CORS issue. Check the browser console for more details. You may need to add this site\'s URL to the "CORS Whitelist" in your Jackett server settings.',
      );
    }
    throw handleFetchError(error);
  }
};


const PUBLIC_TRACKERS = [
  'udp://tracker.openbittorrent.com:80',
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://tracker.torrent.eu.org:451/announce',
  'udp://open.tracker.cl:1337/announce',
  'udp://p4p.arenabg.com:1337/announce',
  'udp://tracker.dler.org:6969/announce',
];

export const searchTorrents = async (
  query: string,
  apiKey: string,
  categoryId?: string
): Promise<TorrentResult[]> => {
  if (!apiKey) {
    throw new Error('Jackett API Key must be provided.');
  }
  
  // The URL is now a relative path, handled by the reverse proxy.
  let url = `/api/api/v2.0/indexers/all/results?apikey=${apiKey}&Query=${encodeURIComponent(query)}`;

  if (categoryId) {
    url += `&Category[]=${categoryId}`;
  }
  url += `&_=${Date.now()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      let errorMessage = `HTTP error! Status: ${response.status}`;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody.error || errorMessage;
      } catch (e) {
        // Response might not be JSON, stick with the status code message
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const results: TorrentResult[] = (data.Results || []).map((result: TorrentResult) => {
        if (!result.MagnetUri && result.InfoHash) {
            const displayName = encodeURIComponent(result.Title);
            const trackerQuery = PUBLIC_TRACKERS.map(tracker => `tr=${encodeURIComponent(tracker)}`).join('&');
            result.MagnetUri = `magnet:?xt=urn:btih:${result.InfoHash}&dn=${displayName}&${trackerQuery}`;
        }
        return result;
    });
    
    return results;

  } catch (error) {
    console.error('Failed to fetch from Jackett API:', error);
    throw handleFetchError(error);
  }
};