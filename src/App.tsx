import React, { useState, useEffect } from 'react';

interface Game {
  id: string;
  name: string;
  subtitle: string;
  url: string;
  icon: string;
  logoUrl: string;
  description: string;
  gradient: string;
  shadow: string;
  border: string;
  buttonBg: string;
  isCustomLogo?: boolean;
}

export default function App() {
  const games: Game[] = [
    {
      id: 'xo',
      name: 'អ៊ិច និង អូ',
      subtitle: 'Tic Tac Toe',
      url: 'https://xo-rho-drab.vercel.app/',
      icon: '❌⭕',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Tic_tac_toe.svg/200px-Tic_tac_toe.svg.png', 
      description: 'តម្រៀប ៣ ត្រង់ដើម្បីឈ្នះ។ តើអ្នកមានយុទ្ធសាស្ត្រល្អជាងដៃគូដែរឬទេ?',
      gradient: 'from-cyan-500 to-blue-700',
      shadow: 'hover:shadow-cyan-500/30',
      border: 'border-cyan-500/20 group-hover:border-cyan-400/50',
      buttonBg: 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400'
    },
    {
      id: 'chess',
      name: 'អុកអន្តរជាតិ',
      subtitle: 'Classic Chess',
      url: 'https://chess-sooty-omega.vercel.app/',
      icon: '♟️',
      logoUrl: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=200&auto=format&fit=crop',
      description: 'សាកល្បងប្រាជ្ញាជាមួយហ្គេមអុកបែបបុរាណ ប្រើតាក់ទិកដើម្បីស៊ីស្តេចគូប្រកួត។',
      gradient: 'from-amber-500 to-orange-700',
      shadow: 'hover:shadow-orange-500/30',
      border: 'border-orange-500/20 group-hover:border-orange-400/50',
      buttonBg: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400'
    },
    {
      id: 'tigercow',
      name: 'ខ្លា និង គោ',
      subtitle: 'Tiger & Cow',
      url: 'https://tiger-cows.vercel.app/',
      icon: '🐯🐮',
      logoUrl: '', 
      description: 'ហ្គេមក្តារប្រពៃណីខ្មែរដ៏ពេញនិយម។ ការពារគោ ឬចាប់គោឲ្យអស់!',
      gradient: 'from-emerald-500 to-green-700',
      shadow: 'hover:shadow-emerald-500/30',
      border: 'border-emerald-500/20 group-hover:border-emerald-400/50',
      buttonBg: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400',
      isCustomLogo: true
    }
  ];

  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showDonateModal, setShowDonateModal] = useState<boolean>(false);
  const [showThankYou, setShowThankYou] = useState<boolean>(false);

  // ទិន្នន័យពី JSON ដែលអ្នកបានផ្តល់ឲ្យ
  const checkoutUrl = "https://checkout.bakongrelay.com/pQOjrGGv1Xkr";

  // ស្តាប់ព្រឹត្តិការណ៍ (Event Listener) សម្រាប់ Iframe PostMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://checkout.bakongrelay.com') return;
      
      if (event.data && event.data.event === 'payment_success') {
        console.log("Payment completed via iframe:", event.data);
        setShowDonateModal(false); // បិទផ្ទាំង Iframe
        setShowThankYou(true);     // បង្ហាញផ្ទាំងអរគុណ
        
        setTimeout(() => {
          setShowThankYou(false);
        }, 5000);
      }
    };

    window.addEventListener('message', handleMessage);

    // ជាជម្រើសមួយទៀត ក្នុងករណី Event បង្កើតដោយ Script ខាងក្នុង Iframe Snippet ត្រូវបាន Trigger
    const handleCustomPaymentSuccess = (e: Event) => {
       console.log("Custom Payment Event triggered:", (e as CustomEvent).detail);
       setShowDonateModal(false);
       setShowThankYou(true);
       setTimeout(() => setShowThankYou(false), 5000);
    };
    window.addEventListener('bakongPaymentSuccess', handleCustomPaymentSuccess);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('bakongPaymentSuccess', handleCustomPaymentSuccess);
    };
  }, []);

  const handlePlayGame = (game: Game) => {
    setActiveGame(game);
    setIsPlaying(true);
  };

  const handleBackToList = () => {
    setIsPlaying(false);
    setTimeout(() => setActiveGame(null), 300);
  };

  const openDonateModal = () => {
    setShowDonateModal(true);
  };

  // ផ្ទាំង Modal សម្រាប់បង្ហាញ Iframe របស់ Bakong
  const BakongIframeModal = () => (
    <div className={`fixed inset-0 z-[150] flex items-center justify-center transition-all duration-300 ${showDonateModal ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => setShowDonateModal(false)}
      ></div>
      
      <div className={`relative w-full max-w-md h-[80vh] max-h-[750px] bg-slate-900 rounded-2xl transform transition-all duration-300 overflow-hidden flex flex-col shadow-2xl shadow-red-900/20 ${showDonateModal ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-8 opacity-0'}`}>
        
        {/* Header របស់ Modal */}
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-slate-800">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <h3 className="text-white font-bold Khmer-font">គាំទ្រពួកយើង</h3>
          </div>
          <button 
            onClick={() => setShowDonateModal(false)}
            className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-1.5 transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ផ្ទៃ Iframe */}
        <div className="flex-1 w-full bg-white relative">
           {showDonateModal && (
             <iframe 
                id='bakong-relay-iframe' 
                src={checkoutUrl} 
                title="Bakong Checkout"
                className="w-full h-full border-none"
                allow='clipboard-write'
             ></iframe>
           )}
        </div>
      </div>
    </div>
  );

  // ផ្ទាំងអរគុណពេលបរិច្ចាគជោគជ័យ
  const ThankYouModal = () => (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center transition-all duration-300 ${showThankYou ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowThankYou(false)}
      ></div>
      <div className={`relative bg-slate-900 border border-green-500/50 shadow-2xl shadow-green-500/20 rounded-2xl p-8 w-[90%] max-w-sm transform transition-all duration-300 text-center ${showThankYou ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-8 opacity-0'}`}>
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-500/40">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2 Khmer-font">សូមអរគុណ!</h3>
        <p className="text-gray-300 mb-6 Khmer-font">
          ការបរិច្ចាគរបស់អ្នកទទួលបានជោគជ័យ។ ពួកយើងពិតជាកោតសរសើរចំពោះការគាំទ្ររបស់អ្នក!
        </p>
        <button 
          onClick={() => setShowThankYou(false)}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-xl transition-colors w-full cursor-pointer Khmer-font"
        >
          បិទ
        </button>
      </div>
    </div>
  );

  // ==========================================
  // ទិដ្ឋភាពពេលកំពុងលេងហ្គេម (Full Screen)
  // ==========================================
  if (isPlaying && activeGame) {
    return (
      <div className="fixed inset-0 w-full h-full bg-slate-950 z-50 flex flex-col font-sans">
        <BakongIframeModal />
        <ThankYouModal />
        
        <iframe
          id="game-iframe"
          title={`លេងហ្គេម ${activeGame.name}`}
          src={activeGame.url}
          className="w-full h-full border-none bg-slate-950"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        ></iframe>

        {/* ប៊ូតុងត្រឡប់មកបញ្ជីហ្គេមវិញ */}
        <button 
          onClick={handleBackToList}
          className="fixed bottom-4 left-4 md:bottom-6 md:left-6 z-40 flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/90 backdrop-blur-md text-white p-3 md:px-5 md:py-3 rounded-full shadow-lg border border-white/10 hover:border-white/20 transition-all group opacity-60 hover:opacity-100 cursor-pointer"
          title="ត្រឡប់ទៅមជ្ឈមណ្ឌលហ្គេមវិញ"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300 group-hover:text-white group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-semibold text-sm hidden md:block Khmer-font">បញ្ជីហ្គេម</span>
        </button>

        {/* ប៊ូតុងគាំទ្រ (Bakong Iframe) */}
        <button
          onClick={openDonateModal}
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 flex items-center justify-center bg-gradient-to-r from-red-600/90 to-red-800/90 hover:from-red-600 hover:to-red-700 backdrop-blur-md text-white p-3 md:px-5 md:py-3 rounded-full shadow-lg border border-red-500/30 transition-all group opacity-80 hover:opacity-100 cursor-pointer"
          title="បរិច្ចាគតាមរយៈ Bakong"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="font-medium text-sm hidden md:block ml-2 Khmer-font">គាំទ្រ (Bakong)</span>
        </button>

      </div>
    );
  }

  // ==========================================
  // ទិដ្ឋភាពទំព័រដើម (Home Page)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans relative overflow-hidden selection:bg-indigo-500 selection:text-white pb-24 md:pb-0">
      
      <BakongIframeModal />
      <ThankYouModal />

      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-fuchsia-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <nav className="relative z-10 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl sticky top-0">
        <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Game<span className="text-indigo-400">Hub</span>
            </h1>
          </div>

          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
              <span className="text-white cursor-pointer transition-colors Khmer-font">ហ្គេមទាំងអស់</span>
              <span className="hover:text-white cursor-pointer transition-colors Khmer-font">អំពីយើង</span>
            </div>
            
            <button 
              onClick={openDonateModal}
              className="flex items-center gap-2 bg-red-600/10 hover:bg-red-600/20 px-4 py-2 rounded-lg text-sm font-medium text-red-500 border border-red-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer animate-pulse"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:block Khmer-font">គាំទ្រ</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 container mx-auto px-4 md:px-8 py-12 md:py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight Khmer-font">
            កម្សាន្តដោយគ្មានដែនកំណត់
          </h2>
          <p className="text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto Khmer-font">
            ជ្រើសរើសហ្គេមខាងក្រោម ហើយចាប់ផ្តើមលេងភ្លាមៗ។ មិនចាំបាច់ដោនឡូត មិនចាំបាច់រង់ចាំ។
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {games.map((game) => (
            <div 
              key={game.id}
              className={`
                group relative bg-slate-900 rounded-3xl p-[1px] 
                transition-all duration-300 hover:-translate-y-1 shadow-lg ${game.shadow}
              `}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-20 group-hover:opacity-40 rounded-3xl transition-opacity duration-300`}></div>
              
              <div className={`bg-slate-900 rounded-[23px] h-full flex flex-col relative z-10 overflow-hidden border ${game.border} transition-colors`}>
                
                <div className={`h-48 relative overflow-hidden bg-slate-950 border-b border-white/5`}>
                   <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity duration-500">
                     <iframe
                        title={`${game.name} Preview`}
                        src={game.url}
                        className="w-full h-full border-none pointer-events-none scale-75 origin-center"
                        tabIndex={-1}
                        aria-hidden="true"
                     />
                   </div>
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                </div>

                <div className="p-6 flex-1 flex flex-col relative">
                  <div className="absolute -top-10 left-6">
                    <div className={`w-16 h-16 rounded-2xl bg-slate-800 p-0.5 shadow-xl border border-white/10 group-hover:border-white/20 transition-colors`}>
                      <div className="w-full h-full bg-slate-900 rounded-[14px] overflow-hidden relative flex items-center justify-center text-2xl">
                         {game.isCustomLogo ? (
                            <div className="w-full h-full flex items-center justify-center relative bg-emerald-950">
                               <div className="absolute left-1/2 -translate-x-full pr-0.5 text-2xl transform -rotate-12 drop-shadow-md">🐯</div>
                               <div className="absolute left-1/2 pl-0.5 text-xl transform rotate-12 drop-shadow-md mt-2">🐮</div>
                            </div>
                         ) : (
                           <>
                             <div className="absolute inset-0 flex items-center justify-center bg-slate-800">{game.icon}</div>
                             <img 
                               src={game.logoUrl} 
                               alt={`${game.name} Logo`} 
                               className="w-full h-full object-cover absolute inset-0 z-10" 
                               onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} 
                               referrerPolicy="no-referrer"
                             />
                           </>
                         )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 mb-6 flex-1">
                    <p className="text-[11px] font-bold text-gray-500 mb-1.5 tracking-widest uppercase">{game.subtitle}</p>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all Khmer-font">
                      {game.name}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 Khmer-font">
                      {game.description}
                    </p>
                  </div>

                  <button 
                    onClick={() => handlePlayGame(game)}
                    className={`
                      w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer Khmer-font
                      transition-all duration-300 ${game.buttonBg} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
                    `}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    ចាប់ផ្តើមលេង
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      
      {/* ប៊ូតុងបរិច្ចាគអណ្តែត នៅទំព័រដើម */}
      <button
        onClick={openDonateModal}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white p-3 md:px-5 md:py-3 rounded-full shadow-lg shadow-red-600/30 border border-white/10 hover:border-white/20 transition-all group focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
        aria-label="បើកផ្ទាំងបរិច្ចាគ Bakong"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <span className="font-medium text-sm hidden md:block ml-2 Khmer-font">Donate (Bakong)</span>
      </button>

      <footer className="relative z-10 py-6 mt-12 border-t border-white/5 bg-slate-950">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-gray-500">
          <p className="Khmer-font">&copy; 2026 GameHub Cambodia. រក្សាសិទ្ធិគ្រប់យ៉ាង។</p>
          <div className="flex gap-4">
             <span className="hover:text-gray-300 cursor-pointer transition-colors Khmer-font">លក្ខខណ្ឌ</span>
             <span className="hover:text-gray-300 cursor-pointer transition-colors Khmer-font">ឯកជនភាព</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
