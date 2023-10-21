import { useState, useEffect } from "react";

import supabase from "../../supabase";
import CardDisplay from "../../Cards";

import "../../styles/styles.css";
import "../../styles/account.css";
import "../../styles/responsive.css";
import "../../styles/card.css";

function eraseCookie(name) {
  document.cookie = name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}

function AccountDisplay({
  viewAccount,
  hasAccount,
  setHasAccount,
  setViewAccount,
  setViewCard,
  selfAccount,
}) {
  const [account, setAccount] = useState(undefined);

  return !account ? (
    <Loading
      viewAccount={viewAccount}
      setAccount={setAccount}
      setViewAccount={setViewAccount}
    />
  ) : (
    <Account
      account={viewAccount}
      setAccount={setAccount}
      setViewAccount={setViewAccount}
      hasAccount={hasAccount}
      setHasAccount={setHasAccount}
      setViewCard={setViewCard}
      selfAccount={selfAccount}
    />
  );
}

function Loading({ viewAccount, setAccount, setViewAccount }) {
  async function loadAccount() {
    const { data, error } = await supabase
      .from("users")
      .select("username, email, bio")
      .eq("username", viewAccount.username)
      .eq("email", viewAccount.email);
    console.log(data);
    if (!error) {
      if (data.length > 0) {
        setAccount((acc) => data[0]);
      } else {
        alert("User not found!");
        setViewAccount((view) => undefined);
      }
    } else {
      alert("An error has occurred");
      setViewAccount((view) => undefined);
    }
  }

  useEffect(() => {
    loadAccount();
  }, []);

  return (
    <section className="loading-container">
      <h1>Loading account...</h1>
    </section>
  );
}

function Account({
  account,
  setAccount,
  setViewAccount,
  hasAccount,
  setHasAccount,
  setViewCard,
  selfAccount,
}) {
  //account variable is the account being viewed currenly

  const [viewPost, setViewPost] = useState("uploaded");
  const [isUpdating, setIsUpdating] = useState(false);
  // const [selfAccount, setSelfAccount] = useState(false);

  const [usernameInput, setUsernameInput] = useState(account.username);
  const [emailInput, setEmailInput] = useState(account.email);
  const [bioInput, setBioInput] = useState(account.bio);

  // useEffect(() => {
  //   if (
  //     usernameInput === account.username &&
  //     emailInput === account.email &&
  //     bioInput === account.bio
  //   )
  //     setCanUpdate(() => false);
  //   else setCanUpdate(() => true);

  //   if (
  //     hasAccount.username === account.username &&
  //     hasAccount.email === account.email
  //   )
  //     setSelfAccount(() => true);
  //   else setSelfAccount(() => false);
  // }, [usernameInput, emailInput, bioInput, hasAccount, account]);

  async function updateAccount() {
    setIsUpdating(true);

    const { data: accCheck, error: accCheckError } = await supabase
      .from("users")
      .select("id")
      .eq("username", account.username)
      .eq("email", account.email);
    if (!accCheckError && accCheck.length > 0) {
      const { data: accUpd, error: accUpdError } = await supabase
        .from("users")
        .update({ username: usernameInput, email: emailInput, bio: bioInput })
        .eq("id", accCheck[0].id)
        .select("username, email, bio");
      if (accUpdError) {
        alert("An error has occurred");
        console.log(accUpdError.message);
        setViewAccount((view) => undefined);
      } else {
        setViewAccount(undefined);
        setHasAccount(undefined);
        setAccount(undefined);
      }
    } else {
      alert("An error has occurred");
      setViewAccount((view) => undefined);
    }

    setIsUpdating(false);
  }

  async function logOut() {
    setHasAccount((acc) => undefined);
    eraseCookie("account");
  }

  function close() {
    setViewAccount((view) => undefined);
  }

  return (
    <section className="account-container">
      <input
        className="username-display"
        type="text"
        placeholder="Username"
        value={usernameInput}
        onChange={(e) => setUsernameInput(e.target.value)}
      />
      <div className="edit-fields">
        <div className="pfp-view">
          <img
            className="prof-image guest-img"
            src={require("../../img/profile.png")}
          />
          <p>Upload your picture</p>
          <input type="file" accept="image" />
        </div>
        <div className="col-field">
          <input
            type="email"
            placeholder="Your email address"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
          />
          <textarea
            placeholder="Your bio"
            value={bioInput}
            onChange={(e) => setBioInput(e.target.value)}
          ></textarea>
        </div>
      </div>
      <div className="edit-fields btn-controls">
        {selfAccount ? (
          <div>
            <button
              onClick={updateAccount}
              className={!isUpdating ? null : "grayed"}
            >
              Update account details
            </button>
            <button className="red" onClick={logOut}>
              Log out
            </button>
          </div>
        ) : null}
        <div>
          <button onClick={close}>Close</button>
        </div>
      </div>
      {/* <div className="card-controls">
        <button
          className={viewPost === "uploaded" ? "selected" : ""}
          onClick={() => setViewPost("uploaded")}
        >
          UPLOADED POSTS
        </button>
        <button
          className={viewPost === "liked" ? "selected" : ""}
          onClick={() => setViewPost("liked")}
        >
          LIKED POSTS
        </button>
        <CardSection
          viewPost={viewPost}
          account={account}
          viewAccount={viewAccount}
        />
      </div> */}
    </section>
  );
}

function CardSection({ viewPost, account, viewAccount }) {
  const [message, setMessage] = useState("Loading...");
  const [cards, setCards] = useState(undefined);

  async function getUploadedCards() {
    console.log(account);
    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .eq("poster", viewAccount);
    if (!error) {
      console.log(data);
    } else {
      setMessage((msg) => "An error has occurred");
      return;
    }
  }

  async function getLikedCards() {
    const { data: likesCheck, error: likesCheckError } = await supabase
      .from("votes")
      .select("*")
      .eq("user_id", account.id)
      .eq("vote", true);
    if (!likesCheckError) {
      if (likesCheck > 0) {
      } else {
        setMessage((msg) => "No upvotes modules yet.");
      }
    } else {
      setMessage((msg) => "An error has occurred");
      return;
    }
  }

  useEffect(() => {
    if (viewPost === "uploaded") getUploadedCards();
    else if (viewPost === "liked") getLikedCards();
  }, [viewPost]);

  return !cards ? (
    <h2>{message}</h2>
  ) : (
    <CardDisplay cards={cards} message={message} />
  );
}

export default AccountDisplay;
