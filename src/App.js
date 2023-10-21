//Lots of functions are called 'facts' since this is a recycle of another project

import { useEffect, useState } from "react";
import { bake_cookie, read_cookie } from "sfcookies";
import supabase from "./supabase";
import { ctg, webHookToken } from "./Data";

import "./styles/styles.css";
import "./styles/responsive.css";
import "./styles/card.css";

import CardWindow from "./pages/extra/Card-Window";
import LogForm from "./pages/login/Login";
import Profile from "./pages/extra/Profile";
import AccountDisplay from "./pages/account/Account";

const isValidUrl = (urlString) => {
  try {
    return Boolean(new URL(urlString));
  } catch (e) {
    return false;
  }
};

function App() {
  const [loggingIn, setLoggingIn] = useState(false);
  const [hasAccount, setAccount] = useState(undefined);
  const [viewAccount, setViewAccount] = useState(undefined);
  //For when the user is viewing their own profile
  const [selfAccount, setSelfAccount] = useState(false);
  const [viewCard, setViewCard] = useState(undefined);
  const [facts, setFacts] = useState([]);
  const [votes, setVotes] = useState([]);

  const setAcc = async () => {
    console.log(read_cookie("account"));
    if (!hasAccount && read_cookie("account")) {
      setLoggingIn(() => true);

      const { data: userCheck, error: userCheckError } = await supabase
        .from("users")
        .select("id, username, email, bio")
        .eq("id", read_cookie("account"));
      if (!userCheckError && userCheck.length > 0) {
        setAccount((acc) => userCheck[0]);
      } else {
        console.log("Not logged in");
      }

      setLoggingIn(() => false);
    }
  };

  useEffect(() => {
    setAcc();
  }, []);

  useEffect(() => {
    if (JSON.stringify(hasAccount) === JSON.stringify(viewAccount))
      setSelfAccount(true);
    else setSelfAccount(false);
  }, [hasAccount, viewAccount]);

  return (
    <>
      {viewCard ? (
        <CardWindow
          account={hasAccount}
          data={viewCard}
          setData={setViewCard}
          cards={facts}
          setCards={setFacts}
        />
      ) : null}

      {hasAccount ? (
        viewAccount ? (
          <AccountDisplay
            viewAccount={viewAccount}
            hasAccount={hasAccount}
            setHasAccount={setAccount}
            setViewAccount={setViewAccount}
            setViewCard={setViewCard}
            selfAccount={selfAccount}
          />
        ) : (
          <Main
            hasAccount={hasAccount}
            setAccount={setAccount}
            setViewAccount={setViewAccount}
            viewAccount={viewAccount}
            viewCard={viewCard}
            setViewCard={setViewCard}
            facts={facts}
            setFacts={setFacts}
            votes={votes}
            setVotes={setVotes}
          />
        )
      ) : (
        <LogForm setAccount={setAccount} />
      )}
    </>
  );
}

function Main({
  hasAccount,
  setViewAccount,
  viewAccount,
  setViewCard,
  facts,
  setFacts,
  votes,
  setVotes,
}) {
  const [showForm, setForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [isLoading, setLoading] = useState(false);
  const [hasError, setError] = useState(false);
  const [hasFilter, setFilterDisplay] = useState(false);
  const [myMods, setMyMods] = useState(undefined);

  useEffect(
    function () {
      async function getFacts() {
        setLoading(true);

        let query = supabase.from("modules").select("*");

        if (filter !== "all") {
          query = query.eq("subject", filter);
        }

        if (myMods !== undefined) query = query.eq("poster", myMods);

        //Loads all card data
        const { data: facts, error: factsError } = await query
          .order("created_at", { ascending: false })
          .limit(100);

        if (!factsError) {
          setFacts(facts);
        } else {
          setError(true);
        }

        //Gets user's vote data
        if (hasAccount === "Guest") return;

        const { data: votes, error: votesError } = await supabase
          .from("votes")
          .select("module_id, vote")
          .eq("user_id", hasAccount.id);
        if (!votesError) setVotes(votes);
        else setError(true);

        setLoading(false);
      }

      getFacts();
    },
    [filter, myMods]
  );

  return (
    <body>
      {hasAccount === "Guest" && !viewAccount ? null : (
        <Profile account={hasAccount} setViewAccount={setViewAccount} />
      )}

      <Header account={hasAccount} showForm={showForm} setForm={setForm} />

      {showForm ? <Form setFacts={setFacts} setShowForm={setForm} /> : null}

      <main>
        <CategoryFilters
          setMyMods={setMyMods}
          setFilter={setFilter}
          setFilterDisplay={setFilterDisplay}
        />
        {hasError ? <ErrorMsg /> : null}
        {hasFilter || myMods ? (
          <FilterDisplay filter={filter} myMods={myMods} />
        ) : null}
        {isLoading ? (
          <Loader />
        ) : (
          <Facts
            facts={facts}
            setFacts={setFacts}
            votes={votes}
            setVotes={setVotes}
            setViewCard={setViewCard}
            myMods={myMods}
          />
        )}
      </main>
    </body>
  );
}

function Loader() {
  return <p className="loading">Loading...</p>;
}

function ErrorMsg() {
  return <p className="loading">An error has occurred.</p>;
}

function Header({ account, showForm, setForm }) {
  return (
    <header>
      <div className="logo">
        <img
          src="./GreyLogo.png"
          height="68"
          width="68"
          alt="Application Logo"
        />
      </div>
      <h1>Grey's Repository</h1>
      <div>
        {account === "Guest" ? null : (
          <button
            className="btn btn-large fact-open"
            onClick={() => setForm((show) => !show)}
          >
            {showForm ? "Close" : "Add Module"}
          </button>
        )}
      </div>
    </header>
  );
}

function FilterDisplay({ filter, myMods }) {
  return (
    <p className="filt-disp">
      {myMods ? "Showing your modules" : `Showing ${filter} category`}
    </p>
  );
}

function Form({ setFacts, setShowForm }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState("");
  const [link, setLink] = useState("");
  const [subject, setSubject] = useState("");
  const [fileUploading, setFileUploading] = useState();
  const [isUploading, setUploading] = useState(false);

  async function handler(e) {
    e.preventDefault();

    // const hook = new WebhookClient({ url: webHookToken });

    if (title && (isValidUrl(link) || file) && subject) {
      setUploading(true);
      const { data: newFact, error } = await supabase
        .from("modules")
        .insert(
          [
            {
              title: title,
              desc: desc,
              file: fileName,
              link: link,
              subject: subject,
              poster: read_cookie("account"),
              id: Math.round(Math.random() * 100000),
            },
          ],
          {
            returning: "minimal",
          }
        )
        .select();

      if (file !== "") handleUpload(file);
      setUploading(false);

      if (!error) {
        setFacts((m) => [newFact[0], ...m]);

        const xml = new XMLHttpRequest();
        xml.open("POST", webHookToken, true);
        xml.setRequestHeader("Content-Type", "application/json");
        xml.send(
          JSON.stringify({
            content: `**${title}**\nA new module has been uploaded by ${
              hasAccount.username
            }\n${desc}\n${link ? link : ""}`,
            username: "Upload Notifier",
          })
        );
      }

      setTitle("");
      setLink("https://");
      setSubject("");

      setShowForm(false);
    }
  }

  async function handleUpload(e) {
    const { data, error } = await supabase.storage
      .from("bi-modules")
      .upload(`public/${fileName}`, file);

    if (data) {
      console.log(data);
    } else {
      alert("An upload error has occurred");
    }
  }

  // async function displayUpload(e) {
  //   let form = new FormData();
  //   form.set('fileInput', e);

  //   form.upload.addEventListener('progres', () => {

  //   });
  // }

  return (
    <form className="fact-form" onSubmit={handler}>
      <input
        placeholder="Name of module"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={isUploading}
      />
      <input
        placeholder="Description"
        type="text"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        disabled={isUploading}
      />
      <input
        placeholder="Select file..."
        name="fileInput"
        type="file"
        onChange={(e) => {
          displayUpload(e.target.files[0]);
          setFileName(e.target.files[0].name);
          setFile(e.target.files[0]);
        }}
        disabled={isUploading}
      />
      {/* <p className="upload-display">Uploading 100%</p> */}
      <input
        placeholder="...or paste a download link"
        type="text"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        disabled={isUploading}
      />
      <select
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        disabled={isUploading}
      >
        <option value="" key="all">
          Select subject:
        </option>
        {ctg.map((el) => (
          <option value={el.name} key={el.name}>
            {el.name}
          </option>
        ))}
      </select>
      <button
        className="btn btn-add"
        style={{ fontSize: 15 }}
        disabled={isUploading}
      >
        Add to database
      </button>
    </form>
  );
}

function CategoryFilters({ setMyMods, setFilter, setFilterDisplay }) {
  const categories = ctg;

  return (
    <aside>
      <button
        className="btn"
        key="all"
        onClick={() => {
          setFilter("all");
          setFilterDisplay(false);
          setMyMods(undefined);
        }}
      >
        All
      </button>
      {categories.map((el) => (
        <button
          key={el.name}
          className="btn"
          style={{ backgroundColor: el.color }}
          onClick={() => {
            setFilter(el.name);
            setFilterDisplay(true);
            setMyMods(undefined);
          }}
        >
          {el.name.toUpperCase()}
        </button>
      ))}
    </aside>
  );
}

function Facts({ facts, setFacts, votes, setVotes, setViewCard }) {
  if (facts.length === 0) {
    return <p className="loading">No modules in this subject currently.</p>;
  } else {
    return (
      <section>
        <ul className="fact-list">
          {facts.map((el) => (
            <Fact
              el={el}
              key={el.id}
              setViewCard={setViewCard}
              votes={votes}
              setVotes={setVotes}
            />
          ))}
        </ul>
      </section>
    );
  }
}

function Fact({ el, setViewCard, votes, setVotes }) {
  const [isVoted, setIsVoted] = useState(undefined);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    votes.forEach((vote) => {
      if (vote.module_id === el.id) setIsVoted(vote.vote ? 1 : 0);
    });
  }, []);

  async function downloadModule() {
    setProcessing(true);

    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .eq("id", el.id);

    if (data[0].file) {
      const { data: toDownload, error: downError } = await supabase.storage
        .from("bi-modules")
        .createSignedUrl(`public/${data[0].file}`, 600, {
          type: "download",
          public: true,
        });

      if (toDownload) {
        window.open(toDownload.signedUrl);
      } else if (downError) console.log(downError);
    } else {
      window.open(el.link);
    }

    setProcessing(false);
  }

  async function deleteModule() {
    setProcessing(true);
    const { data: toDelete, error } = await supabase
      .from("modules")
      .delete()
      .eq("id", el.id)
      .select();

    setProcessing(false);
    if (!error) {
      alert(
        "That module has been deleted. Refresh the page to see it removed."
      );
    }
  }

  async function viewCard() {
    setViewCard({
      id: el.id,
      title: el.title,
      desc: el.desc,
      subject: el.subject,
      poster: el.poster,
    });
  }

  async function handleVote(v) {
    const prevVote = isVoted;
    setIsVoted(v ? 1 : 0);

    //FIXME: Inefficient use of if statement
    if (!prevVote) {
      const voteUpd = v
        ? { upvotes: el.upvotes + 1 }
        : { downvotes: el.downvotes + 1 };

      const { data: moduleUpd, error: moduleUpdError } = await supabase
        .from("modules")
        .update(voteUpd)
        .eq("id", el.id);
      if (!moduleUpdError) {
        const { data: voteUpd, error: voteUpdError } = await supabase
          .from("votes")
          .insert([
            { user_id: read_cookie("account"), module_id: el.id, vote: v },
          ]);
        if (voteUpdError) {
          alert("An error has occurred");
          console.log(voteUpdError.message);
          setIsVoted(prevVote);
        }
      } else {
        alert("An error has occurred");
        console.log(moduleUpdError.message);
        setIsVoted(prevVote);
      }
    } else {
      const voteUpd = v
        ? { upvotes: el.upvotes + 1, downvotes: el.downvotes - 1 }
        : { upvotes: el.upvotes - 1, downvotes: el.downvotes + 1 };

      const { data: moduleUpd, error: moduleUpdError } = await supabase
        .from("modules")
        .update(voteUpd)
        .eq("id", el.id);
      if (!moduleUpdError) {
        const { data: voteUpd, error: voteUpdError } = await supabase
          .from("votes")
          .update({ vote: v })
          .eq("user_id", read_cookie("account"))
          .eq("modules_id", el.id);
        if (voteUpdError) {
          alert("An error has occurred");
          console.log(voteUpdError.message);
          setIsVoted(prevVote);
        }
      } else {
        alert("An error has occurred");
        console.log(moduleUpdError.message);
        setIsVoted(prevVote);
      }
    }
  }

  return (
    <li className="card" key={el.id}>
      <p className="card-poster">Posted by {el.poster}</p>
      <div className="card-header" onClick={viewCard}>
        <p>{el.title}</p>
      </div>
      <div className="card-desc">
        <p>{el.desc}</p>
        <a>
          <button className="btn" onClick={downloadModule}>
            Download
          </button>
        </a>
        <a>
          {read_cookie("account").toString() === el.poster ? (
            <button
              className="btn small"
              onClick={deleteModule}
              disabled={processing}
            >
              ❌
            </button>
          ) : null}
        </a>
      </div>
      <div className="card-votes">
        <button
          className={isVoted === 1 ? "pressed" : null}
          disabled={isVoted === 1}
          onClick={() => handleVote(true)}
        >
          <img
            src="./img/upvote.svg"
            style={{ filter: "hue-rotate: (145deg)" }}
          />
          <p disabled={isVoted === 1}>{el.upvotes}</p>
        </button>
        <button
          className={isVoted === 0 ? "pressed" : null}
          disabled={isVoted === 0}
          onClick={() => handleVote(false)}
        >
          <img
            src="./img/upvote.svg"
            style={{
              filter: "hue-rotate: (270deg)",
              transform: "rotate(180deg)",
            }}
          />
          <p>{el.downvotes}</p>
        </button>
      </div>
    </li>
  );
}

export default App;
