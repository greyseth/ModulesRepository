import { useState, useEffect, useRef } from "react";
import supabase from "../../supabase";
import "../../styles/index.css";
import "../../styles/login.css";
import "../../styles/responsive.css";

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

function RecoveryPage({ setResettingPassword, setAccount }) {
  const [recoveryAcc, setRecoveryAcc] = useState("");
  const [PWreset, setPWreset] = useState(false);
  const [sentCode, setSentCode] = useState(false);

  return sentCode ? (
    PWreset ? (
      <PasswordReset recoveryAcc={recoveryAcc} setAccount={setAccount} />
    ) : (
      <CodeInput
        recoveryAcc={recoveryAcc}
        setAccount={setAccount}
        setPWreset={setPWreset}
      />
    )
  ) : (
    <AccountInput
      setSentCode={setSentCode}
      recoveryAcc={recoveryAcc}
      setRecoveryAcc={setRecoveryAcc}
      setResettingPassword={setResettingPassword}
    />
  );
}

function AccountInput({
  setSentCode,
  recoveryAcc,
  setRecoveryAcc,
  setResettingPassword,
}) {
  const [loading, setLoading] = useState(false);

  async function accountSubmit() {
    setLoading((load) => true);

    //Checks for user
    const { data: userCheck, error: userCheckError } = await supabase
      .from("users")
      .select("id")
      .eq("email", recoveryAcc);
    if (!userCheckError) {
      if (userCheck.length === 0) {
        alert(`No account with username/email '${recoveryAcc}' was found`);
        setLoading((load) => false);
        return;
      }
    } else {
      console.log(userCheckError.message);
      alert("An error occurred during authentication");
      setLoading((load) => false);
      return;
    }

    //Stores auth key data
    const { data: auth, error: authError } = await supabase
      .from("user_auth")
      .insert({ email: recoveryAcc })
      .select();
    //Unsafe, will find solution later
    if (authError) {
      console.log(authError.message);
      alert("An error occurred during token storing");
      setLoading((load) => false);
      return;
    }

    //Sends email (I don't have money to properly host the API...)
    const apiResponse = await fetch(
      "https://greybot.greyseth.repl.co/sendcode",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: { email: recoveryAcc, code: auth[0].token },
        }),
      }
    );
    const response = await apiResponse.json();
    if (response.error) {
      console.log(response.error);
      alert("An error has occurred during email send");
      setLoading((load) => false);
      return;
    }

    setLoading((load) => false);
    setSentCode((sent) => true);
  }

  return (
    <section className="recovery-container">
      <div className="recovery">
        <h2 className="logform-title">RESET PASSWORD</h2>
        <input
          type="text"
          placeholder="Your Email"
          onChange={(e) => setRecoveryAcc(e.target.value)}
        />
        {loading ? (
          <p className="loading">Loading...</p>
        ) : (
          <div className="btn-container">
            <button onClick={accountSubmit}>Send Confirmation Code</button>
            <button
              onClick={() => {
                setResettingPassword((pw) => false);
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function CodeInput({ recoveryAcc, setPWreset }) {
  const [loading, setLoading] = useState(false);
  const [codeInput, setCodeInput] = useState("");

  async function sendCode() {
    setLoading((load) => true);

    const { data, error } = await supabase
      .from("user_auth")
      .select("email")
      .eq("token", codeInput)
      .eq("email", recoveryAcc);
    if (!error) {
      if (data.length > 0) {
      } else {
        alert("Invalid code!");
        setLoading((load) => false);
        return;
      }
    } else {
      console.log(error.message);
      alert("An error has occurred duing code authentication");
      setLoading((load) => false);
      return;
    }

    const { data: delData, error: delError } = await supabase
      .from("user_auth")
      .delete()
      .eq("token", codeInput);
    if (delError) {
      console.log(error.message);
      alert("An error has occurred duing code authentication");
      setLoading((load) => false);
      return;
    }

    setPWreset((pw) => true);
    setLoading((load) => false);
  }

  return (
    <section className="recovery-container">
      <div className="recovery">
        <h2 className="logform-title">CHECK YOUR MAIL</h2>
        <input
          type="text"
          placeholder="Enter recovery code"
          onChange={(e) => setCodeInput(e.target.value)}
        />
        {loading ? (
          <p className="loading">Confirming...</p>
        ) : (
          <button onClick={sendCode}>Confirm</button>
        )}
      </div>
    </section>
  );
}

function PasswordReset({ recoveryAcc, setAccount }) {
  const [loading, setLoading] = useState(false);
  const [newPW, setNewPW] = useState("");

  async function setPassword() {
    setLoading((load) => true);

    if (newPW.length >= 8) {
      const { data, error } = await supabase
        .from("users")
        .update({ password: newPW })
        .eq("email", recoveryAcc)
        .select();
      setCookie("account", data[0].id, 30);
      setAccount(data[0].username);
    } else alert("Password must be 8 characters or longer!");

    setLoading((load) => false);
  }

  return (
    <section className="recovery-container">
      <div className="recovery">
        <h2 className="logform-title">CREATE NEW PASSWORD</h2>
        <input
          type="password"
          placeholder="Enter new password"
          onChange={(e) => setNewPW(e.target.value)}
        />
        {loading ? (
          <p className="loading">Updating password...</p>
        ) : (
          <button onClick={setPassword}>Reset</button>
        )}
      </div>
    </section>
  );
}

export default RecoveryPage;
