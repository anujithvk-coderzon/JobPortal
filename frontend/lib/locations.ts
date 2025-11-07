// Popular cities database for instant autocomplete suggestions
export const POPULAR_LOCATIONS = [
  // United States - Major Cities
  { name: "New York, New York, United States", country: "US", type: "city" },
  { name: "Los Angeles, California, United States", country: "US", type: "city" },
  { name: "Chicago, Illinois, United States", country: "US", type: "city" },
  { name: "Houston, Texas, United States", country: "US", type: "city" },
  { name: "Phoenix, Arizona, United States", country: "US", type: "city" },
  { name: "Philadelphia, Pennsylvania, United States", country: "US", type: "city" },
  { name: "San Antonio, Texas, United States", country: "US", type: "city" },
  { name: "San Diego, California, United States", country: "US", type: "city" },
  { name: "Dallas, Texas, United States", country: "US", type: "city" },
  { name: "San Jose, California, United States", country: "US", type: "city" },
  { name: "Austin, Texas, United States", country: "US", type: "city" },
  { name: "Jacksonville, Florida, United States", country: "US", type: "city" },
  { name: "Fort Worth, Texas, United States", country: "US", type: "city" },
  { name: "Columbus, Ohio, United States", country: "US", type: "city" },
  { name: "San Francisco, California, United States", country: "US", type: "city" },
  { name: "Charlotte, North Carolina, United States", country: "US", type: "city" },
  { name: "Indianapolis, Indiana, United States", country: "US", type: "city" },
  { name: "Seattle, Washington, United States", country: "US", type: "city" },
  { name: "Denver, Colorado, United States", country: "US", type: "city" },
  { name: "Boston, Massachusetts, United States", country: "US", type: "city" },
  { name: "Portland, Oregon, United States", country: "US", type: "city" },
  { name: "Miami, Florida, United States", country: "US", type: "city" },
  { name: "Atlanta, Georgia, United States", country: "US", type: "city" },
  { name: "Las Vegas, Nevada, United States", country: "US", type: "city" },
  { name: "Detroit, Michigan, United States", country: "US", type: "city" },
  { name: "Nashville, Tennessee, United States", country: "US", type: "city" },

  // India - Metro Cities & Major Tech Hubs
  { name: "Mumbai, Maharashtra, India", country: "IN", type: "city" },
  { name: "Delhi, Delhi, India", country: "IN", type: "city" },
  { name: "Bangalore, Karnataka, India", country: "IN", type: "city" },
  { name: "Hyderabad, Telangana, India", country: "IN", type: "city" },
  { name: "Chennai, Tamil Nadu, India", country: "IN", type: "city" },
  { name: "Kolkata, West Bengal, India", country: "IN", type: "city" },
  { name: "Pune, Maharashtra, India", country: "IN", type: "city" },
  { name: "Ahmedabad, Gujarat, India", country: "IN", type: "city" },

  // India - State Capitals & Important Cities (Tier 1 & 2)
  { name: "Jaipur, Rajasthan, India", country: "IN", type: "city" },
  { name: "Lucknow, Uttar Pradesh, India", country: "IN", type: "city" },
  { name: "Chandigarh, Chandigarh, India", country: "IN", type: "city" },
  { name: "Thiruvananthapuram, Kerala, India", country: "IN", type: "city" },
  { name: "Bhubaneswar, Odisha, India", country: "IN", type: "city" },
  { name: "Bhopal, Madhya Pradesh, India", country: "IN", type: "city" },
  { name: "Indore, Madhya Pradesh, India", country: "IN", type: "city" },
  { name: "Nagpur, Maharashtra, India", country: "IN", type: "city" },
  { name: "Patna, Bihar, India", country: "IN", type: "city" },
  { name: "Raipur, Chhattisgarh, India", country: "IN", type: "city" },
  { name: "Ranchi, Jharkhand, India", country: "IN", type: "city" },
  { name: "Guwahati, Assam, India", country: "IN", type: "city" },
  { name: "Dehradun, Uttarakhand, India", country: "IN", type: "city" },
  { name: "Shimla, Himachal Pradesh, India", country: "IN", type: "city" },
  { name: "Gangtok, Sikkim, India", country: "IN", type: "city" },
  { name: "Imphal, Manipur, India", country: "IN", type: "city" },
  { name: "Shillong, Meghalaya, India", country: "IN", type: "city" },
  { name: "Kohima, Nagaland, India", country: "IN", type: "city" },
  { name: "Aizawl, Mizoram, India", country: "IN", type: "city" },
  { name: "Agartala, Tripura, India", country: "IN", type: "city" },
  { name: "Itanagar, Arunachal Pradesh, India", country: "IN", type: "city" },

  // India - Major Commercial & Industrial Cities
  { name: "Surat, Gujarat, India", country: "IN", type: "city" },
  { name: "Vadodara, Gujarat, India", country: "IN", type: "city" },
  { name: "Rajkot, Gujarat, India", country: "IN", type: "city" },
  { name: "Visakhapatnam, Andhra Pradesh, India", country: "IN", type: "city" },
  { name: "Vijayawada, Andhra Pradesh, India", country: "IN", type: "city" },
  { name: "Guntur, Andhra Pradesh, India", country: "IN", type: "city" },
  { name: "Nellore, Andhra Pradesh, India", country: "IN", type: "city" },
  { name: "Kochi, Kerala, India", country: "IN", type: "city" },
  { name: "Kozhikode, Kerala, India", country: "IN", type: "city" },
  { name: "Kannur, Kerala, India", country: "IN", type: "city" },
  { name: "Thrissur, Kerala, India", country: "IN", type: "city" },
  { name: "Coimbatore, Tamil Nadu, India", country: "IN", type: "city" },
  { name: "Madurai, Tamil Nadu, India", country: "IN", type: "city" },
  { name: "Salem, Tamil Nadu, India", country: "IN", type: "city" },
  { name: "Tiruchirappalli, Tamil Nadu, India", country: "IN", type: "city" },
  { name: "Tiruppur, Tamil Nadu, India", country: "IN", type: "city" },
  { name: "Vellore, Tamil Nadu, India", country: "IN", type: "city" },

  // India - IT & Tech Hubs
  { name: "Noida, Uttar Pradesh, India", country: "IN", type: "city" },
  { name: "Gurgaon, Haryana, India", country: "IN", type: "city" },
  { name: "Faridabad, Haryana, India", country: "IN", type: "city" },
  { name: "Mysore, Karnataka, India", country: "IN", type: "city" },
  { name: "Mangalore, Karnataka, India", country: "IN", type: "city" },
  { name: "Hubli, Karnataka, India", country: "IN", type: "city" },
  { name: "Belgaum, Karnataka, India", country: "IN", type: "city" },

  // India - Uttar Pradesh Cities
  { name: "Kanpur, Uttar Pradesh, India", country: "IN", type: "city" },
  { name: "Ghaziabad, Uttar Pradesh, India", country: "IN", type: "city" },
  { name: "Agra, Uttar Pradesh, India", country: "IN", type: "city" },
  { name: "Varanasi, Uttar Pradesh, India", country: "IN", type: "city" },
  { name: "Meerut, Uttar Pradesh, India", country: "IN", type: "city" },
  { name: "Allahabad, Uttar Pradesh, India", country: "IN", type: "city" },
  { name: "Bareilly, Uttar Pradesh, India", country: "IN", type: "city" },
  { name: "Aligarh, Uttar Pradesh, India", country: "IN", type: "city" },
  { name: "Moradabad, Uttar Pradesh, India", country: "IN", type: "city" },
  { name: "Saharanpur, Uttar Pradesh, India", country: "IN", type: "city" },
  { name: "Gorakhpur, Uttar Pradesh, India", country: "IN", type: "city" },

  // India - Maharashtra Cities
  { name: "Thane, Maharashtra, India", country: "IN", type: "city" },
  { name: "Navi Mumbai, Maharashtra, India", country: "IN", type: "city" },
  { name: "Nashik, Maharashtra, India", country: "IN", type: "city" },
  { name: "Aurangabad, Maharashtra, India", country: "IN", type: "city" },
  { name: "Solapur, Maharashtra, India", country: "IN", type: "city" },
  { name: "Amravati, Maharashtra, India", country: "IN", type: "city" },
  { name: "Kolhapur, Maharashtra, India", country: "IN", type: "city" },

  // India - Punjab, Haryana & Rajasthan Cities
  { name: "Ludhiana, Punjab, India", country: "IN", type: "city" },
  { name: "Amritsar, Punjab, India", country: "IN", type: "city" },
  { name: "Jalandhar, Punjab, India", country: "IN", type: "city" },
  { name: "Patiala, Punjab, India", country: "IN", type: "city" },
  { name: "Bathinda, Punjab, India", country: "IN", type: "city" },
  { name: "Jodhpur, Rajasthan, India", country: "IN", type: "city" },
  { name: "Kota, Rajasthan, India", country: "IN", type: "city" },
  { name: "Udaipur, Rajasthan, India", country: "IN", type: "city" },
  { name: "Ajmer, Rajasthan, India", country: "IN", type: "city" },
  { name: "Bikaner, Rajasthan, India", country: "IN", type: "city" },

  // India - West Bengal, Bihar & Jharkhand Cities
  { name: "Durgapur, West Bengal, India", country: "IN", type: "city" },
  { name: "Asansol, West Bengal, India", country: "IN", type: "city" },
  { name: "Siliguri, West Bengal, India", country: "IN", type: "city" },
  { name: "Gaya, Bihar, India", country: "IN", type: "city" },
  { name: "Bhagalpur, Bihar, India", country: "IN", type: "city" },
  { name: "Muzaffarpur, Bihar, India", country: "IN", type: "city" },
  { name: "Jamshedpur, Jharkhand, India", country: "IN", type: "city" },
  { name: "Dhanbad, Jharkhand, India", country: "IN", type: "city" },
  { name: "Bokaro, Jharkhand, India", country: "IN", type: "city" },

  // India - Other Important Cities
  { name: "Srinagar, Jammu and Kashmir, India", country: "IN", type: "city" },
  { name: "Jammu, Jammu and Kashmir, India", country: "IN", type: "city" },
  { name: "Leh, Ladakh, India", country: "IN", type: "city" },
  { name: "Panaji, Goa, India", country: "IN", type: "city" },
  { name: "Margao, Goa, India", country: "IN", type: "city" },
  { name: "Pondicherry, Puducherry, India", country: "IN", type: "city" },
  { name: "Silchar, Assam, India", country: "IN", type: "city" },
  { name: "Dibrugarh, Assam, India", country: "IN", type: "city" },

  // United Kingdom
  { name: "London, England, United Kingdom", country: "GB", type: "city" },
  { name: "Manchester, England, United Kingdom", country: "GB", type: "city" },
  { name: "Birmingham, England, United Kingdom", country: "GB", type: "city" },
  { name: "Leeds, England, United Kingdom", country: "GB", type: "city" },
  { name: "Glasgow, Scotland, United Kingdom", country: "GB", type: "city" },
  { name: "Edinburgh, Scotland, United Kingdom", country: "GB", type: "city" },
  { name: "Liverpool, England, United Kingdom", country: "GB", type: "city" },
  { name: "Bristol, England, United Kingdom", country: "GB", type: "city" },

  // Canada
  { name: "Toronto, Ontario, Canada", country: "CA", type: "city" },
  { name: "Vancouver, British Columbia, Canada", country: "CA", type: "city" },
  { name: "Montreal, Quebec, Canada", country: "CA", type: "city" },
  { name: "Calgary, Alberta, Canada", country: "CA", type: "city" },
  { name: "Ottawa, Ontario, Canada", country: "CA", type: "city" },
  { name: "Edmonton, Alberta, Canada", country: "CA", type: "city" },

  // Australia
  { name: "Sydney, New South Wales, Australia", country: "AU", type: "city" },
  { name: "Melbourne, Victoria, Australia", country: "AU", type: "city" },
  { name: "Brisbane, Queensland, Australia", country: "AU", type: "city" },
  { name: "Perth, Western Australia, Australia", country: "AU", type: "city" },
  { name: "Adelaide, South Australia, Australia", country: "AU", type: "city" },

  // Europe - Major Cities
  { name: "Berlin, Germany", country: "DE", type: "city" },
  { name: "Munich, Germany", country: "DE", type: "city" },
  { name: "Hamburg, Germany", country: "DE", type: "city" },
  { name: "Paris, France", country: "FR", type: "city" },
  { name: "Lyon, France", country: "FR", type: "city" },
  { name: "Marseille, France", country: "FR", type: "city" },
  { name: "Madrid, Spain", country: "ES", type: "city" },
  { name: "Barcelona, Spain", country: "ES", type: "city" },
  { name: "Rome, Italy", country: "IT", type: "city" },
  { name: "Milan, Italy", country: "IT", type: "city" },
  { name: "Amsterdam, Netherlands", country: "NL", type: "city" },
  { name: "Brussels, Belgium", country: "BE", type: "city" },
  { name: "Vienna, Austria", country: "AT", type: "city" },
  { name: "Zurich, Switzerland", country: "CH", type: "city" },
  { name: "Stockholm, Sweden", country: "SE", type: "city" },
  { name: "Copenhagen, Denmark", country: "DK", type: "city" },
  { name: "Dublin, Ireland", country: "IE", type: "city" },
  { name: "Lisbon, Portugal", country: "PT", type: "city" },

  // Asia - Other Major Cities
  { name: "Singapore, Singapore", country: "SG", type: "city" },
  { name: "Tokyo, Japan", country: "JP", type: "city" },
  { name: "Seoul, South Korea", country: "KR", type: "city" },
  { name: "Hong Kong, Hong Kong", country: "HK", type: "city" },
  { name: "Dubai, United Arab Emirates", country: "AE", type: "city" },
  { name: "Shanghai, China", country: "CN", type: "city" },
  { name: "Beijing, China", country: "CN", type: "city" },
  { name: "Bangkok, Thailand", country: "TH", type: "city" },
  { name: "Kuala Lumpur, Malaysia", country: "MY", type: "city" },

  // Remote work indicator
  { name: "Remote", country: "REMOTE", type: "remote" },
  { name: "Remote - United States", country: "US", type: "remote" },
  { name: "Remote - Europe", country: "EU", type: "remote" },
  { name: "Remote - Worldwide", country: "GLOBAL", type: "remote" },
];

// Search popular locations locally (instant, no API call)
export function searchLocalLocations(query: string, limit: number = 5): typeof POPULAR_LOCATIONS {
  if (!query || query.length < 2) return [];

  const lowerQuery = query.toLowerCase();

  return POPULAR_LOCATIONS
    .filter(location =>
      location.name.toLowerCase().includes(lowerQuery)
    )
    .slice(0, limit);
}

// Cache for API results
const locationCache = new Map<string, any>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export function getCachedLocation(query: string) {
  const cached = locationCache.get(query.toLowerCase());
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

export function setCachedLocation(query: string, data: any) {
  locationCache.set(query.toLowerCase(), {
    data,
    timestamp: Date.now(),
  });
}
