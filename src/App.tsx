import React, { useState, useEffect } from 'react';

interface Game {
  id: string;
  name: string;
  url: string;
  icon: string;
  description: string;
  bgImage: string;
}

export default function App() {
  const games: Game[] = [
    {
      id: 'xo',
      name: 'អ៊ិច និង អូ (X & O)',
      url: 'https://xo-rho-drab.vercel.app/',
      icon: '❌⭕',
      description: 'លេងហ្គេមតម្រៀប ៣ ត្រង់ដើម្បីឈ្នះ',
      bgImage: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop'
    },
    {
      id: 'chess',
      name: 'អុក (Chess)',
      url: 'https://chess-sooty-omega.vercel.app/',
      icon: '♟️',
      description: 'ហ្គេមអុកបែបបុរាណ និងយុទ្ធសាស្ត្រ',
      bgImage: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?q=80&w=1000&auto=format&fit=crop'
    },
    {
      id: 'tigercow',
      name: 'ខ្លា និង គោ (Tiger & Cow)',
      url: 'https://tiger-cows.vercel.app/',
      icon: '🐯🐮',
      description: 'ហ្គេមក្តារប្រពៃណីខ្មែរដ៏ពេញនិយម',
      bgImage: 'https://images.unsplash.com/photo-1588612502660-f4728d8b1368?q=80&w=1000&auto=format&fit=crop'
    }
  ];

  // ស្ថានភាពគ្រប់គ្រងហ្គេមដែលកំពុងលេង និងទិដ្ឋភាពបង្ហាញ
  const [activeGame, setActiveGame] = useState<Game | null>(null); // null មានន័យថានៅទំព័រដើម (បញ្ជី)
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // មុខងារសម្រាប់បើកហ្គេម (ចូល Full Screen)
  const handlePlayGame = (game: Game) => {
    setActiveGame(game);
    setIsPlaying(true);
  };

  // មុខងារសម្រាប់ត្រឡប់មកបញ្ជីដើមវិញ
  const handleBackToList = () => {
    setIsPlaying(false);
    setTimeout(() => setActiveGame(null), 300); // រង់ចាំឲ្យ animation ចប់សិនទើបលុបហ្គេមចេញ
  };

  // ទិដ្ឋភាពពេលកំពុងលេងហ្គេម (Full Screen Iframe)
  if (isPlaying && activeGame) {
    return (
      <div className="fixed inset-0 w-full h-full bg-black z-50 flex flex-col">
        {/* របារឧបករណ៍ពេលកំពុងលេង (អាចឲ្យវាតូច ឬលាក់ពេលអូសចុះលើក៏បាន តែនៅទីនេះដាក់តូចនៅខាងលើ) */}
        <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center p-2 md:p-4 opacity-0 hover:opacity-100 transition-opacity duration-300 bg-gradient-to-b from-black/70 to-transparent">
          <button 
            onClick={handleBackToList}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white px-4 py-2 rounded-full transition-all cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2050/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">ត្រឡប់ក្រោយ</span>
          </button>
          
          <div className="text-white bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-sm font-semibold">
            {activeGame.name}
          </div>
          
          {/* ប៊ូតុង Refresh (បើចង់) */}
          <button 
             onClick={() => {
                const iframe = document.getElementById('game-iframe') as HTMLIFrameElement;
                if(iframe) iframe.src = iframe.src;
             }}
            className="bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-2 rounded-full transition-all cursor-pointer"
            title="ចាប់ផ្ដើមឡើងវិញ"
          >
            <svg xmlns="http://www.w3.org/2050/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* សារណែនាំឲ្យអូសកណ្ដុរទៅខាងលើដើម្បីបង្ហាញប៊ូតុងត្រឡប់ក្រោយ */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-white/50 text-xs pointer-events-none animate-pulse">
          អូសកណ្ដុរមកផ្នែកខាងលើដើម្បីមើលម៉ឺនុយ
        </div>

        <iframe
          id="game-iframe"
          title={`លេងហ្គេម ${activeGame.name}`}
          src={activeGame.url}
          className="w-full h-full border-none bg-black"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        ></iframe>
      </div>
    );
  }

  // ទិដ្ឋភាពទំព័រដើម (បញ្ជីជ្រើសរើសហ្គេម)
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      
      {/* របារផ្នែកខាងលើ */}
      <header className="bg-indigo-900 border-b border-zinc-800 text-white p-6 shadow-md flex justify-center items-center">
        <div className="flex items-center space-x-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          <h1 className="text-3xl font-extrabold tracking-wider Khmer-font">មជ្ឈមណ្ឌលហ្គេម</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-4xl font-bold text-white mb-2 Khmer-font">ជ្រើសរើសហ្គេមរបស់អ្នក</h2>
          <p className="text-xl text-zinc-400 Khmer-font">សូមរីករាយកម្សាន្តជាមួយហ្គេមដែលយើងមានផ្តល់ជូននៅទីនេះ</p>
        </div>

        {/* បញ្ជីហ្គេមបង្ហាញជាកាត (Cards) ធំៗ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {games.map((game) => (
            <div 
              key={game.id}
              className="bg-zinc-900 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-zinc-800 flex flex-col group cursor-pointer"
              onClick={() => handlePlayGame(game)}
            >
              {/* ផ្នែករូបភាព (ប្រើរូបភាពជំនួស ឬពណ៌ទទេ) */}
              <div className="h-48 bg-indigo-950 relative overflow-hidden flex items-center justify-center">
                 <div className="absolute inset-0 bg-gradient-to-br from-indigo-800 to-purple-950 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                 <div className="relative z-10 text-6xl transform group-hover:scale-125 transition-transform duration-500">
                    {game.icon}
                 </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold text-white mb-2 Khmer-font">{game.name}</h3>
                <p className="text-zinc-400 mb-6 flex-1 Khmer-font">{game.description}</p>
                
                <button 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer Khmer-font"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  លេងឥឡូវនេះ
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
      
      <footer className="text-center py-6 text-zinc-500 text-sm mt-auto Khmer-font">
        &copy; 2026 មជ្ឈមណ្ឌលហ្គេម. រក្សាសិទ្ធិគ្រប់យ៉ាង។
      </footer>
    </div>
  );
}
