import { useState, useEffect } from "react";
import { bake_cookie } from "sfcookies";
import supabase from "../../supabase";

import "../../styles/styles.css";
import "../../styles/login.css";
import "../../styles/responsive.css";

import RecoveryPage from "./Recovery";

function LogForm({ setAccount }) {
  const [resettingPassword, setResettingPassword] = useState(false);

  return resettingPassword ? (
    <RecoveryPage
      setResettingPassword={setResettingPassword}
      setAccount={setAccount}
    />
  ) : (
    <DataInputs
      setResettingPassword={setResettingPassword}
      setAccount={setAccount}
    />
  );
}

function DataInputs({ setResettingPassword, setAccount }) {
  const [userInput, setUserInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passInput, setPassInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (loading) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("users")
      .select("id, username, email, bio")
      .eq("username", userInput)
      .eq("email", emailInput)
      .eq("password", passInput);

    if (!error) {
      if (data.length > 0) {
        bake_cookie("account", data[0].id);
        setAccount(data[0]);
      } else alert("Incorrect credentials provided");
    } else alert("An error has occurred");

    setLoading(false);
  }

  async function handleSignup() {
    if (!userInput || !passInput || !emailInput) {
      alert("You must fill your login credentials!");
      return;
    }

    setLoading(true);

    const { data: userCheck, error: userCheckError } = await supabase
      .from("users")
      .select("username, email")
      .eq("email", emailInput);
    if (!userCheckError) {
      if (userCheck.length > 0) {
        alert("An account with the same email already exists!");
        return;
      }
    } else {
      alert("A server error has occurred");
      return;
    }

    const { data: newUser, newUserError } = await supabase
      .from("users")
      .insert([{ username: userInput, password: passInput, email: emailInput }])
      .select();
    if (newUser) {
      console.log(newUser);
      bake_cookie("account", newUser[0].id, 30);
      setAccount(newUser[0]);
    } else if (newUserError) {
      alert("An error has occurred\n" + newUserError);
    }

    setLoading(false);
  }

  function guestLogin() {
    if (loading) return;

    bake_cookie("account", "Guest", 1);
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
        placeholder="Your Email address"
        type="email"
        onChange={(e) => {
          setEmailInput(e.target.value);
        }}
      />
      <input
        type="password"
        placeholder="Your password"
        onChange={(e) => {
          setPassInput(e.target.value);
        }}
      />
      {loading ? (
        <p className="loading">Loading...</p>
      ) : (
        <div className="btn-container">
          <button onClick={handleLogin}>Log in</button>
          <button onClick={handleSignup}>Create an account</button>
        </div>
      )}
      <div>
        <p onClick={guestLogin}>Continue as a guest</p>
        <p onClick={() => setResettingPassword((pw) => true)}>
          Forgot password?
        </p>
      </div>
    </section>
  );
}

export default LogForm;
