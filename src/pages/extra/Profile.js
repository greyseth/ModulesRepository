import { useRef, useState, useEffect } from "react";
import "../../styles/profile.css";

function Profile({ account, setViewAccount }) {
  return (
    <section className="profile">
      <div
        onClick={() => {
          setViewAccount((view) => account);
        }}
        className="profbtn"
      >
        <img src={require("../../img/profile.png")} />
      </div>
    </section>
  );
}

export default Profile;
