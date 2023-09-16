//Lots of functions are called 'facts' since this is a recycle of another project

import { useEffect, useState } from "react";
import "./styles/styles.css";
import "./styles/responsive.css";
import supabase from "./supabase";
import CardWindow from "./Card-Window";
import LogForm from "./Account";
import Profile from "./Profile";
import { ctg } from "./Data";

const isValidUrl = (urlString) => {
  try {
    return Boolean(new URL(urlString));
  } catch (e) {
    return false;
  }
};

//Cookies
function setCookie(name, value, days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie =
    name + "=" + (value || "") + expires + "; path=/;SameSite=None";
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

function App() {
  const [hasAccount, setAccount] = useState("");

  const setAcc = async () => {
    setAccount(getCookie("account"));
  };

  useEffect(() => {
    setAcc();

    //await connect();
  }, []);

  return (
    <>
      {hasAccount ? (
        <Main hasAccount={hasAccount} setAccount={setAccount} />
      ) : (
        <LogForm setAccount={setAccount} />
      )}
    </>
  );
}

function Main({ hasAccount, setAccount }) {
  const [facts, setFacts] = useState([]);
  const [showForm, setForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [isLoading, setLoading] = useState(false);
  const [hasError, setError] = useState(false);
  const [hasFilter, setFilterDisplay] = useState(false);
  const [viewCard, setViewCard] = useState(undefined);
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

        const { data: facts, error } = await query
          .order("created_at", { ascending: false })
          .limit(100);

        if (!error) {
          setFacts(facts);
          setLoading(false);
        } else {
          setError(true);
        }
      }
      getFacts();
    },
    [filter, myMods]
  );

  return (
    <body>
      {viewCard ? (
        <CardWindow
          account={hasAccount}
          data={viewCard}
          setData={setViewCard}
          cards={facts}
          setCards={setFacts}
        />
      ) : null}

      <Profile
        account={hasAccount}
        setAccount={setAccount}
        setMyMods={setMyMods}
      />

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
  const [isUploading, setUploading] = useState(false);

  async function handler(e) {
    e.preventDefault();

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
              poster: getCookie("account"),
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

      if (!error) setFacts((m) => [newFact[0], ...m]);

      setTitle("");
      setLink("https://");
      setSubject("");

      setShowForm(false);
    }
  }

  async function handleUpload(e) {
    console.log(file);
    const { data, error } = await supabase.storage
      .from("bi-modules")
      .upload(`public/${fileName}`, file);

    if (data) {
      console.log(data);
    } else {
      console.log(error);
    }
  }

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
        type="file"
        onChange={(e) => {
          setFileName(e.target.files[0].name);
          setFile(e.target.files[0]);
        }}
        disabled={isUploading}
      />
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

function Facts({ facts, setFacts, setViewCard }) {
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
              setFacts={setFacts}
              setViewCard={setViewCard}
            />
          ))}
        </ul>
      </section>
    );
  }
}

function Fact({ el, setFacts, setViewCard }) {
  const [processing, setProcessing] = useState(false);

  async function downloadModule() {
    setProcessing(true);

    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .eq("id", el.id);
    console.log(data[0]);

    if (data[0].file) {
      // const { data: toDownload, error: downError } = await supabase.storage
      //   .from("bi-modules")
      //   .download(`public/${data[0].file}`);

      console.log(data[0].file);
      const { data: toDownload, error: downError } = await supabase.storage
        .from("bi-modules")
        .createSignedUrl(`public/${data[0].file}`, 600, {
          type: "download",
          public: true,
        });

      if (toDownload) {
        window.open(toDownload.signedUrl);
        // console.log(toDownload);
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
    // const { data: toFileDelete, error: fileError } = await supabase.storage
    //   .from("bi-modules")
    //   .remove(`public/${toDownload.file}`)
    //   .then((response) => {
    //     console.log(response);
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //   });

    setProcessing(false);
    if (!error) {
      // setFacts(function (m) {
      //   for (let i = 0; i < m.length; i++) {
      //     if (m.id === el.id) {
      //       m.splice(i, 1);
      //     }
      //   }
      // });
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
          {getCookie("account") === el.poster ? (
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
    </li>
  );
}

export default App;
