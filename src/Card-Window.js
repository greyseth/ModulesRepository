import { useEffect, useState } from "react";
import "./styles/styles.css";
import "./styles/responsive.css";
import supabase from "./supabase";
import { ctg } from "./Data";

function CardWindow({ account, data, setData, cards, setCards }) {
  const [updTitle, setUpdTitle] = useState(data.title);
  const [updSubject, setUpdSubject] = useState(data.subject);
  const [updDesc, setUpdDesc] = useState(data.desc);
  const [isUpdating, setUpdating] = useState(false);
  // const [loadingComments, setLoading] = useState(false);

  async function updateData() {
    if (updTitle) {
      setUpdating(true);

      const { data: updData, error } = await supabase
        .from("modules")
        .update({ title: updTitle, desc: updDesc, subject: updSubject })
        .eq("id", data.id)
        .select();
      if (updData) {
        // console.log(updData);
        // console.log(`${updData.id}\n${typeof updData.id}`);
        let cardsTemp = cards;
        cardsTemp.find((f) => f.id === Number(updData[0].id)).title = updTitle;
        cardsTemp.find((f) => f.id === Number(updData[0].id)).desc = updDesc;
        cardsTemp.find((f) => f.id === Number(updData[0].id)).subject =
          updSubject;

        setCards(cardsTemp);
      } else alert("An error has occurred during the process.\n" + error);

      setUpdating(false);
    } else {
      alert("You can't leave the title empty!");
    }
  }

  function closeWindow() {
    if (isUpdating) return;
    setData(undefined);
  }

  return (
    <div className="window-container">
      <div className="window">
        <input
          type="text"
          value={updTitle}
          onChange={(e) => setUpdTitle(e.target.value)}
        />
        <textarea
          value={updDesc}
          onChange={(e) => setUpdDesc(e.target.value)}
        />
        <div className="dropdowns">
          <select
            value={updSubject}
            onChange={(e) => setUpdSubject(e.target.value)}
          >
            {ctg.map((el) => (
              <option value={el.name} key={el.name}>
                {el.name}
              </option>
            ))}
          </select>
          <div>
            {account === data.poster ? (
              <button onClick={updateData}>
                {isUpdating ? "Updating..." : "Save edits"}
              </button>
            ) : null}
            <button onClick={closeWindow}>Close</button>
          </div>
        </div>
      </div>
      {/* <div className="comments">
        <ul>
          <li>
            <p>Username</p>
            <p>
              lorem ipsum dolor sit amet amet sit dolor ipsum lorem lorem ipsum
              dolor sit amet amet sit dolor ipsum lorem
            </p>
          </li>
          <li>
            <p>Username</p>
            <p>
              lorem ipsum dolor sit amet amet sit dolor ipsum lorem lorem ipsum
              dolor sit amet amet sit dolor ipsum lorem lorem ipsum dolor sit
              amet amet sit dolor ipsum lorem lorem ipsum dolor sit amet amet
              sit dolor ipsum lorem
            </p>
          </li>
        </ul>
        <input type="text" placeholder="Add a comment..."></input>
      </div>
      //Coming soon feature (maybe idk) */}
    </div>
  );
}

export default CardWindow;
