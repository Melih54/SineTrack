const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

// TMDB varsayılan API Anahtarı (Ortam değişkeninden veya genel v3 anahtarından)
const API_KEY = process.env.TMDB_API_KEY || "4e44d9029b1270a757cddc766a1bcb63";

export const getImageUrl = (path: string | null | undefined, size: "w500" | "w1280" | "original" = "w500") => {
  if (!path) return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80";
  if (path.startsWith("http")) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

export interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type?: "movie" | "tv";
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
}

export interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
  overview: string;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  air_date: string;
  vote_average: number;
}

export interface MediaDetail extends MediaItem {
  tagline?: string;
  runtime?: number;
  genres?: { id: number; name: string }[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: Season[];
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
  };
  videos?: {
    results: { id: string; key: string; name: string; site: string; type: string }[];
  };
}

// Fallback Mock Verileri (API bağlantı sorunu veya offline durumlar için tam uyumlu)
export const FALLBACK_MOVIES: MediaItem[] = [
  {
    id: 693134,
    title: "Dune: Çöl Gezegeni Bölüm İki",
    overview: "Paul Atreides, ailesini yok eden komploculara karşı intikam arayışındayken Chani ve Fremen'lerle güçlerini birleştirir. Evrenin kaderini belirleyecek savaş başlamak üzeredir.",
    poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    backdrop_path: "/xOMo8BRK7PfcJv9JCnx7s520b2.jpg",
    media_type: "movie",
    vote_average: 8.3,
    release_date: "2024-02-27",
  },
  {
    id: 872585,
    title: "Oppenheimer",
    overview: "J. Robert Oppenheimer'ın Manhattan Projesi kapsamında ilk nükleer silahları geliştirme sürecini ve sonrasındaki ahlaki ve siyasi hesaplaşmalarını anlatan biyografik başyapıt.",
    poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    backdrop_path: "/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg",
    media_type: "movie",
    vote_average: 8.1,
    release_date: "2023-07-19",
  },
  {
    id: 157336,
    title: "Yıldızlararası (Interstellar)",
    overview: "İnsanlığın Dünya'daki ömrü tükenirken bir grup astronot, yeni bir yaşanabilir gezegen bulabilmek için bir solucan deliğinden geçerek bilinmeyen galaksilere doğru yolculuğa çıkar.",
    poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    backdrop_path: "/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
    media_type: "movie",
    vote_average: 8.4,
    release_date: "2014-11-05",
  },
  {
    id: 27205,
    title: "Başlangıç (Inception)",
    overview: "Dom Cobb, insanların rüyalarından bilinçaltı sırlarını çalan usta bir hırsızdır. Ona sunulan son ve imkansız görev: bir fikri çalmak değil, zihne yerleştirmektir.",
    poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    backdrop_path: "/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
    media_type: "movie",
    vote_average: 8.4,
    release_date: "2010-07-15",
  },
  {
    id: 155,
    title: "Kara Şövalye (The Dark Knight)",
    overview: "Batman, Teğmen Gordon ve Bölge Savcısı Harvey Dent, Gotham'daki suça karşı mücadeleyi sürdürürken şehri anarşiye sürükleyen Joker ortaya çıkar.",
    poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdrop_path: "/dqK9Hag1054tghRQSqLSfrkvQnA.jpg",
    media_type: "movie",
    vote_average: 8.5,
    release_date: "2008-07-16",
  },
];

export const FALLBACK_TVS: MediaItem[] = [
  {
    id: 1396,
    name: "Breaking Bad",
    overview: "Kanser teşhisi konan bir lise kimya öğretmeni olan Walter White, ailesinin geleceğini garanti altına almak için eski bir öğrencisiyle birlikte metamfetamin üretimine başlar.",
    poster_path: "/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg",
    backdrop_path: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
    media_type: "tv",
    vote_average: 8.9,
    first_air_date: "2008-01-20",
  },
  {
    id: 94605,
    name: "Arcane",
    overview: "Piltover'ın ütopik şehri ile Zaun'un baskı altındaki yeraltı dünyası arasındaki sert çatışmada iki ikonik League of Legends şampiyonu (Vi ve Jinx) karşı karşıya gelir.",
    poster_path: "/fqldf2t8ztc9aiwn397rHgYeRao.jpg",
    backdrop_path: "/2ombOoJYJUmnvdLz4n0zM572s6y.jpg",
    media_type: "tv",
    vote_average: 8.7,
    first_air_date: "2021-11-06",
  },
  {
    id: 66732,
    name: "Stranger Things",
    overview: "Küçük bir kasabada genç bir çocuk kaybolduğunda, gizli deneyler, doğaüstü güçler ve tuhaf küçük bir kızla dolu gizemli bir dünya gün yüzüne çıkar.",
    poster_path: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
    backdrop_path: "/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
    media_type: "tv",
    vote_average: 8.6,
    first_air_date: "2016-07-15",
  },
  {
    id: 126308,
    name: "Shōgun",
    overview: "1600'lerin feodal Japonyasında, iç savaşın eşiğindeki Lord Toranaga, gizemli bir Avrupa gemisi ve onun İngiliz kaptanının gelişiyle kaderini değiştirecek bir güç dengesi yakalar.",
    poster_path: "/7O4iVfOMQmdCSxhOg1WNzG1AgYT.jpg",
    backdrop_path: "/2rmK7mnchw9Xr3XdiTFSxTTvYQI.jpg",
    media_type: "tv",
    vote_average: 8.5,
    first_air_date: "2024-02-27",
  },
];

async function fetchFromTMDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  try {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.set("api_key", API_KEY);
    url.searchParams.set("language", "tr-TR");
    
    Object.entries(params).forEach(([key, val]) => {
      url.searchParams.set(key, val);
    });

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 }, // 1 saat önbellek
    });

    if (!res.ok) {
      // Türkçe çeviri yoksa en-US ile tekrar dene
      url.searchParams.set("language", "en-US");
      const fallbackRes = await fetch(url.toString(), { next: { revalidate: 3600 } });
      if (fallbackRes.ok) {
        return (await fallbackRes.json()) as T;
      }
      return null;
    }

    return (await res.json()) as T;
  } catch (error) {
    console.warn(`TMDB fetch failed for ${endpoint}:`, error);
    return null;
  }
}

export async function getTrending(mediaType: "movie" | "tv" | "all" = "all", timeWindow: "day" | "week" = "week"): Promise<MediaItem[]> {
  const data = await fetchFromTMDB<{ results: MediaItem[] }>(`/trending/${mediaType}/${timeWindow}`);
  if (data?.results && data.results.length > 0) {
    return data.results.map((item) => ({
      ...item,
      media_type: item.media_type || (mediaType === "all" ? "movie" : mediaType),
    }));
  }
  return mediaType === "tv" ? FALLBACK_TVS : FALLBACK_MOVIES;
}

export async function getPopularMovies(): Promise<MediaItem[]> {
  const data = await fetchFromTMDB<{ results: MediaItem[] }>("/movie/popular");
  return data?.results && data.results.length > 0
    ? data.results.map((m) => ({ ...m, media_type: "movie" }))
    : FALLBACK_MOVIES;
}

export async function getPopularTV(): Promise<MediaItem[]> {
  const data = await fetchFromTMDB<{ results: MediaItem[] }>("/tv/popular");
  return data?.results && data.results.length > 0
    ? data.results.map((t) => ({ ...t, media_type: "tv" }))
    : FALLBACK_TVS;
}

export async function getTopRated(mediaType: "movie" | "tv" = "movie"): Promise<MediaItem[]> {
  const data = await fetchFromTMDB<{ results: MediaItem[] }>(`/${mediaType}/top_rated`);
  return data?.results && data.results.length > 0
    ? data.results.map((item) => ({ ...item, media_type: mediaType }))
    : mediaType === "movie" ? FALLBACK_MOVIES : FALLBACK_TVS;
}

export async function getMediaDetails(mediaType: "movie" | "tv", id: number): Promise<MediaDetail | null> {
  const data = await fetchFromTMDB<MediaDetail>(`/${mediaType}/${id}`, {
    append_to_response: "credits,videos",
  });

  if (data) {
    return { ...data, media_type: mediaType };
  }

  // Fallback find
  const fallbackList = mediaType === "movie" ? FALLBACK_MOVIES : FALLBACK_TVS;
  const fallback = fallbackList.find((item) => item.id === id) || fallbackList[0];
  
  return {
    ...fallback,
    media_type: mediaType,
    genres: [{ id: 1, name: "Aksiyon" }, { id: 2, name: "Bilim Kurgu" }, { id: 3, name: "Dram" }],
    runtime: 145,
    number_of_seasons: mediaType === "tv" ? 3 : undefined,
    number_of_episodes: mediaType === "tv" ? 24 : undefined,
    seasons: mediaType === "tv" ? [
      { id: 101, name: "1. Sezon", season_number: 1, episode_count: 8, poster_path: fallback.poster_path, overview: "İlk sezon maceraları" },
      { id: 102, name: "2. Sezon", season_number: 2, episode_count: 8, poster_path: fallback.poster_path, overview: "İkinci sezon gerilimi" },
      { id: 103, name: "3. Sezon", season_number: 3, episode_count: 8, poster_path: fallback.poster_path, overview: "Üçüncü sezon finali" },
    ] : undefined,
  };
}

export async function getSeasonDetails(tvId: number, seasonNumber: number): Promise<Episode[]> {
  const data = await fetchFromTMDB<{ episodes: Episode[] }>(`/tv/${tvId}/season/${seasonNumber}`);
  if (data?.episodes && data.episodes.length > 0) {
    return data.episodes;
  }

  // Fallback 8 episodes
  return Array.from({ length: 8 }, (_, i) => ({
    id: tvId * 100 + seasonNumber * 10 + (i + 1),
    name: `${seasonNumber}. Sezon ${i + 1}. Bölüm`,
    overview: "Kahramanlarımızın beklenmedik gelişmeler karşısında kritik kararlar aldığı sürükleyici bölüm.",
    episode_number: i + 1,
    season_number: seasonNumber,
    still_path: null,
    air_date: "2024-01-01",
    vote_average: 8.4,
  }));
}

export async function searchMulti(query: string): Promise<MediaItem[]> {
  if (!query || query.trim().length === 0) return [];
  const data = await fetchFromTMDB<{ results: MediaItem[] }>("/search/multi", { query });
  if (data?.results) {
    return data.results.filter((item) => item.media_type === "movie" || item.media_type === "tv");
  }

  const all = [...FALLBACK_MOVIES, ...FALLBACK_TVS];
  return all.filter((item) => {
    const title = (item.title || item.name || "").toLowerCase();
    return title.includes(query.toLowerCase());
  });
}
