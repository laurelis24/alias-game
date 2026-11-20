 <main className="app-shell">
      <section className="game-card wide-card">
        <div className="topline">
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span>Istaba: <strong>{room.code}</strong></span>
            <span>Komanda: <svg width={30} xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={player.team || "black"}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg></span>

          </div>
          <button className="small secondary" onClick={leaveGame}>Pamest spēli</button>
        </div>



        {room.status === "waiting" && (
          <>
            <h1>Izvēlies komandu</h1>
            <p className="subtitle">Spēlētāji: {room.players.length}</p>
            <div className="team-grid">
              <div className="team-panel red-panel">
                <h2>Sarkanā komanda</h2>
                {redPlayers.map(p => <p key={p.id}>{p.nickname}{p.isHost ? " ★" : ""}</p>)}
                <button onClick={() => request("team:choose", "red")}>Pievienoties sarkanajiem</button>
              </div>
              <div className="team-panel blue-panel">
                <h2>Zilā komanda</h2>
                {bluePlayers.map(p => <p key={p.id}>{p.nickname}{p.isHost ? " ★" : ""}</p>)}
                <button onClick={() => request("team:choose", "blue")}>Pievienoties zilajiem</button>
              </div>
            </div>
            {player.isHost && <button onClick={() => request("game:start")}>Sākt spēli</button>}
          </>
        )}

        {room.status === "paused" && <Modal isHost={isHost} />}



        {(room.status === "playing") && (
          <>
            <div className="score-row">
              <div className="score red-score">
                <span>SARKANIE</span>
                <strong>{room.scores.red}</strong>
              </div>

              <Hourglass
                timeLeft={timeLeft}
                totalTime={60}
              />

              <div className="score blue-score">
                <span>ZILIE</span>
                <strong>{room.scores.blue}</strong>
              </div>
            </div>
            {/* <div>
              {me?.team === "blue" ? "Sarkanā komanda" : "Zilā komanda"}
            </div> */}
            <p className="turn-label">Tagad spēlē: {room.currentTeam === "red" ? "Sarkanā komanda" : "Zilā komanda"}</p>
            <p className="explainer">Skaidro: {room.players.find(p => p.id === room.activePlayerId)?.nickname || "—"}</p>
            <p className="current-score">{room.scorePerRound}</p>

            {isMyTurn && <div className="word-area">
              <p>Tavs vārds</p>
              <h2>{word || "..."}</h2>
              <div className="action-row">
                <button onClick={() => request("game:correct")}>Uzminēts! +1</button>
                <button className="secondary" onClick={() => request("game:skip")}>Izlaist</button>
              </div>
            </div>}



            {isHost && <div className="host-actions">
              <button className="danger" onClick={
                
                () => {
                  if (!confirm("Vai tiešām vēlaties beigt spēli!?")){
                    return;
                  }
                  request("game:end")
                }
              }>Beigt spēli</button>
            </div>}
          </>
        )}

        {room.status === "finished" && (
          <>
            <h1>Spēle beigusies!</h1>
            <div className="score-row">
              <div className="score red-score"><span>SARKANIE</span><strong>{room.scores.red}</strong></div>
              <div className="score blue-score"><span>ZILIE</span><strong>{room.scores.blue}</strong></div>
            </div>
            <h2>{room.scores.red === room.scores.blue ? "Neizšķirts!" : room.scores.red > room.scores.blue ? "Uzvar sarkanā komanda!" : "Uzvar zilā komanda!"}</h2>
            {isHost && <button onClick={leaveGame}>Atgriezties sākumā</button>}
          </>
        )}
        {error && <p className="error">{error}</p>}
      </section>
    </main>