import { useState, useEffect } from "react";
import "./styles/profile.css";
import supabase from "./supabase";

function getCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(";");
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function eraseCookie(name) {
  document.cookie = name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}

function Profile({ account, setAccount, setMyMods }) {
  const [viewMenu, setViewMenu] = useState(false);

  function handleLogout() {
    eraseCookie("account");
    setAccount(undefined);
  }

  return (
    <section className="profile">
      {viewMenu ? (
        <div className="profmenu">
          <p>{account}</p>
          <button onClick={handleLogout}>Log out</button>
          {account === "Guest" ? null : (
            <button
              onClick={() => {
                setMyMods(account);
              }}
            >
              Your modules
            </button>
          )}
        </div>
      ) : null}
      <div onClick={() => setViewMenu((m) => !m)} className="profbtn">
        <img src={require("./img/profile.png")} />
      </div>
    </section>
  );
}

export default Profile;
