function SpotifyEmbed({ trackId }: { trackId: string }) {
  return (
    <div className="flex-none w-72">
      <iframe
        style={{ borderRadius: '12px' }}
        src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator`}
        width="100%"
        height={152}
        frameBorder="0"
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div>
  );
}

export function SpotifyPlayer() {
  const trackIds = [
    "6B75WGGugFzGfyVWSF38Q1", // so real
    "6ySdUGsQ5pLqWl059qF9Ps", // Letting Go
    "6ohPUY7p09Xfx2JMfX0r5t", // Duke Ellington's Sound of Love
    "4xBGYIZndfEI1puWGcyfo9", // How I Know
    "0loJyuSFr6vVPBQSmLLrrQ", // How Deep Is Your Love
    "4YT2Sp08acVJeA1bniNTxv", // Blues on Sunday
    "3TnqliDSJY2iWjL6F38ocE", // Moment's Notice
    "4TYMwYxRfhcqWfxe7zbThu", // Magic Alive
    "0Nl0zIgbfgzXwxVf0lndc3", // Sevilla Breeze
    
  ];

  return (
    <section id="spotify" className="scroll-mt-20 mt-16">
      <div className="mb-10 space-y-3">
        <h2 className="text-3xl md:text-4xl font-bold">Current Favorite Songs</h2>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Some tracks I've had on repeat lately.
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {trackIds.map((id) => (
          <SpotifyEmbed key={id} trackId={id} />
        ))}
      </div>
    </section>
  );
}

export default SpotifyPlayer;
