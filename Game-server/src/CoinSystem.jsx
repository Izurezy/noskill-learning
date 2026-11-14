
import React, { useState, useEffect } from "react";
import "./CoinSystem.css";

/* ==========================================
   SECTION 1: STRUCTURE SHOP DATA

   Defines the defensive structures available
   for users to purchase with earned coins.
========================================== */

const structures = [
  { id: 1, name: "Basic Tower", price: 50 },
  { id: 2, name: "Archer Tower", price: 100 },
  { id: 3, name: "Cannon Tower", price: 150 },
];

/* ==========================================
   SECTION 2: REWARD CONSTANTS

   Defines how many coins users earn through
   questions and study sessions.
========================================== */

const QUESTION_REWARD = 10;
const SESSION_REWARD = 100;
const SESSION_DURATION = 15 * 60;

/* ==========================================
   SECTION 3: MAIN COIN SYSTEM COMPONENT
========================================== */

export default function CoinSystem() {

  /* ------------------------------------------
     SECTION 3A: STATE MANAGEMENT
  ------------------------------------------ */

  const [coins, setCoins] = useState(() =>
    Number(localStorage.getItem("coins")) || 0
  );

  const [purchased, setPurchased] = useState(() =>
    JSON.parse(localStorage.getItem("purchased") || "[]")
  );

  const [message, setMessage] = useState("");

  // Study session timer states
  const [secondsRemaining, setSecondsRemaining] =
    useState(SESSION_DURATION);

  const [isSessionActive, setIsSessionActive] =
    useState(false);

  /* ------------------------------------------
     SECTION 3B: SAVE USER PROGRESS

     Saves coins and purchases in localStorage.
  ------------------------------------------ */

  useEffect(() => {
    localStorage.setItem("coins", coins);
    localStorage.setItem("purchased", JSON.stringify(purchased));
  }, [coins, purchased]);

  /* ------------------------------------------
     SECTION 4: COIN REWARD FUNCTIONS
  ------------------------------------------ */

  // Adds earned coins to the user's balance
  function awardCoins(amount) {
    setCoins(previous => previous + amount);
  }

  // Rewards users for answering questions correctly
  function checkAnswer(isCorrect) {
    if (isCorrect) {
      awardCoins(QUESTION_REWARD);
      setMessage(`Correct! You earned ${QUESTION_REWARD} coins.`);
    } else {
      setMessage("Incorrect answer. Try again!");
    }
  }

  /* ------------------------------------------
     SECTION 5: STUDY SESSION TIMER

     Starts a 15-minute countdown.
     Awards coins only when the timer finishes.
  ------------------------------------------ */

  function startStudySession() {
    if (isSessionActive) return;

    setSecondsRemaining(SESSION_DURATION);
    setMessage("Your study session has started!");
    setIsSessionActive(true);
  }

  // Runs the countdown while the session is active
  useEffect(() => {
    if (!isSessionActive) return;

    const timer = setInterval(() => {
      setSecondsRemaining(previous => {
        if (previous <= 1) {
          clearInterval(timer);
          setIsSessionActive(false);
          awardCoins(SESSION_REWARD);
          setMessage(`Study session completed! You earned ${SESSION_REWARD} coins!`);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSessionActive]);

  // Converts seconds into minutes and seconds
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  /* ------------------------------------------
     SECTION 6: STRUCTURE PURCHASE FUNCTION

     Checks the user's balance before allowing
     them to purchase a defensive structure.
  ------------------------------------------ */

  function buyStructure(structure) {
    if (purchased.includes(structure.id)) {
      setMessage("You already own this structure!");
      return;
    }

    if (coins < structure.price) {
      setMessage("Not enough coins!");
      return;
    }

    setCoins(previous => previous - structure.price);

    setPurchased(previous => [
      ...previous,
      structure.id
    ]);

    setMessage(`You purchased ${structure.name}!`);
  }

  /* ------------------------------------------
     SECTION 7: USER INTERFACE
  ------------------------------------------ */

  return (
    <div className="coin-system">

      {/* SECTION 7A: COIN WALLET */}

      <div className="wallet">
        <h2>🪙 Your Coins</h2>
        <h1>{coins}</h1>
      </div>

      {/* SECTION 7B: QUESTION REWARDS */}

      <div className="study-reward">
        <h2>Question Rewards</h2>

        <p>Answer questions correctly to earn coins!</p>

        <p>Correct answer: +{QUESTION_REWARD} coins</p>

        {/* Temporary buttons for testing */}
        <button onClick={() => checkAnswer(true)}>
          Test: Correct Answer (+10)
        </button>

        <button onClick={() => checkAnswer(false)}>
          Test: Incorrect Answer (+0)
        </button>
      </div>

      {/* SECTION 7C: STUDY SESSION REWARDS */}

      <div className="study-session">
        <h2>15-Minute Study Session</h2>

        <p>Complete a study session to earn 100 coins!</p>

        <h1>
          {minutes}:{String(seconds).padStart(2, "0")}
        </h1>

        <button
          onClick={startStudySession}
          disabled={isSessionActive}
        >
          {isSessionActive ? "Session In Progress" : "Start Study Session"}
        </button>
      </div>

      {/* SECTION 7D: STRUCTURE SHOP */}

      <div className="shop">
        <h2>🏰 Structure Shop</h2>

        {structures.map(structure => (
          <div className="shop-item" key={structure.id}>
            <div>
              <h3>{structure.name}</h3>
              <p>Price: {structure.price} coins</p>
            </div>

            <button
              onClick={() => buyStructure(structure)}
              disabled={purchased.includes(structure.id)}
            >
              {purchased.includes(structure.id)
                ? "Owned"
                : "Purchase"}
            </button>
          </div>
        ))}
      </div>

      {/* SECTION 7E: TRANSACTION MESSAGES */}

      {message && <p className="message">{message}</p>}

    </div>
  );
}
