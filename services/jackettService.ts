import type { TorrentResult, Category } from '../types';

// NOTE: This service has been updated to use the Prowlarr API.

const handleFetchError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }
  return new Error('An unknown error occurred during fetch.');
};

const getApiHeaders = (apiKey: string) => {
  const headers = new Headers();
  headers.append('X-Api-Key', apiKey);
  return headers;
};

export const fetchCategories = async (
  apiKey: string
): Promise<Category[]> => {
  // Prowlarr API endpoint for categories. Proxied via /prowlarr/.
  const url = `/prowlarr/api/v1/definition/category`;

  try {
    const response = await fetch(url, { headers: getApiHeaders(apiKey) });
    if (!response.ok) {
       if (response.status === 401) {
            throw new Error('Invalid API Key. Please check your Prowlarr settings.');
       }
      throw new Error(`Failed to fetch categories with status: ${response.status}`);
    }
    
    const data: Category[] = await response.json();
    data.sort((a, b) => a.name.localeCompare(b.name));
    return data;

  } catch (error) {
    console.error('Failed to fetch or parse categories from Prowlarr:', error);
    throw handleFetchError(error);
  }
};

export const testJackettConnection = async (baseUrl: string, apiKey: string): Promise<void> => {
  // This function is kept for the unused SettingsPanel, updated for Prowlarr.
  if (!baseUrl || !apiKey) {
    throw new Error('Prowlarr URL and API Key must be provided.');
  }

  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const url = `${cleanBaseUrl}/api/v1/system/status`;

  try {
    const response = await fetch(url, { headers: getApiHeaders(apiKey) });
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Invalid API Key.');
        }
      throw new Error(`Connection test failed. Status: ${response.status}`);
    }

    const data = await response.json();
    if (data.appName !== 'Prowlarr') {
        throw new Error('Connected to an application, but it is not Prowlarr.');
    }
    
  } catch (error) {
    console.error('Failed to test Prowlarr connection:', error);
    if (error instanceof TypeError) {
      throw new Error(
        'Network error or CORS issue. Check the browser console and your Prowlarr CORS configuration if connecting directly.',
      );
    }
    throw handleFetchError(error);
  }
};

export const searchTorrents = async (
  query: string,
  apiKey: string,
  categoryId?: string
): Promise<TorrentResult[]> => {
  if (!apiKey) {
    throw new Error('Prowlarr API Key must be provided.');
  }
  
  // Prowlarr API search endpoint. Proxied via /prowlarr/.
  const params = new URLSearchParams({
    query: query,
    type: 'search',
  });
  
  if (categoryId) {
    params.append('categories', categoryId);
  }

  const url = `/prowlarr/api/v1/search?${params.toString()}`;

  try {
    const response = await fetch(url, { headers: getApiHeaders(apiKey) });

    if (!response.ok) {
      let errorMessage = `HTTP error! Status: ${response.status}`;
      if (response.status === 401) {
        errorMessage = 'Invalid API Key provided.'
      } else {
        try {
            const errorBody = await response.json();
            errorMessage = errorBody.message || errorMessage;
        } catch (e) {
            // Response might not be JSON, stick with the status code message
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Map Prowlarr API response to our TorrentResult type, filtering for torrents only
    const results: TorrentResult[] = (data || [])
      .filter((result: any) => result.protocol === 'torrent')
      .map((result: any): TorrentResult => ({
        Id: result.id,
        Tracker: result.indexer,
        CategoryDesc: result.categories?.[0]?.name || 'N/A',
        Title: result.title,
        Link: result.downloadUrl,
        Details: result.infoUrl,
        MagnetUri: result.magnetUrl,
        InfoHash: result.infoHash,
        Size: result.size,
        Seeders: result.seeders,
        Peers: result.leechers, // Prowlarr uses 'leechers' for peers
        PublishDate: result.publishDate,
    }));
    
    return results;

  } catch (error) {
    console.error('Failed to fetch from Prowlarr API:', error);
    throw handleFetchError(error);
  }
};