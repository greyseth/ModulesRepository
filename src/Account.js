import { useState, useEffect } from "react";
import supabase from "./supabase";
import "./styles/styles.css";
import "./styles/account.css";
import "./styles/responsive.css";

//Cookies
function setCookie(name, value, days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie =
    name + "=" + (value || "") + expires + "; path=/;SameSite=Lax";
}

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

function LogForm({ setAccount }) {
  const [isGuest, setIsGuest] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [passInput, setPassInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (loading) return;

    setLoading(true);

    const { data: users, error } = await supabase.from("users").select("*");

    console.log(`${users}\n${userInput}`);
    const foundUser = users.find((f) => f.username === userInput);
    if (foundUser) {
      if (passInput === foundUser.password) {
        setCookie("account", foundUser.username);
        setAccount(foundUser.username);
      } else {
        alert("Password does not match!");
      }
    } else {
      alert("Username not recognized!");
    }

    setLoading(false);
  }

  async function handleSignup() {
    if (loading) return;

    setLoading(true);

    const { data: allUsers, error: allUserError } = await supabase
      .from("users")
      .select("*");
    if (allUsers.find((f) => f.username === userInput)) {
      alert(`An account with the name '${userInput}' already exists!`);
      return;
    } else if (allUserError) alert(`An error has occurred\n${allUserError}`);

    const { data: newUser, newUserError } = await supabase
      .from("users")
      .insert([{ username: userInput, password: passInput }])
      .select();
    if (newUser) {
      console.log(newUser);
      setCookie("account", newUser[0].username);
      setAccount(newUser[0].username);
    } else if (newUserError) {
      alert("An error has occurred\n" + newUserError);
    }

    setLoading(false);
  }

  function guestLogin() {
    if (loading) return;

    setCookie("account", "Guest");
    setAccount("Guest");
  }

  return (
    <section className="logform">
      <h2 className="logform-title">Create an account or log in to continue</h2>
      <input
        placeholder="Your username"
        onChange={(e) => {
          setUserInput(e.target.value);
        }}
      />
      <input
        type="password"
        placeholder="Your password"
        onChange={(e) => {
          setPassInput(e.target.value);
        }}
      />
      <button onClick={handleLogin}>{loading ? "Loading..." : "Log in"}</button>
      <button onClick={handleSignup}>
        {loading ? "Loading..." : "Create an account"}
      </button>
      <p onClick={guestLogin}>Continue as a guest</p>
    </section>
  );
}

export default LogForm;
