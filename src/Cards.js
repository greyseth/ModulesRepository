import "./styles/styles.css";
import "./styles/card.css";

function CardDisplay({ cards, message, setViewCard }) {
  if (cards.length === 0) {
    return <p className="loading">{message}</p>;
  } else {
    return (
      <section>
        <ul className="fact-list">
          {cards.map((el) => (
            <Fact el={el} key={el.id} setViewCard={setViewCard} />
          ))}
        </ul>
      </section>
    );
  }
}

function Card({ el, setViewCard }) {
  const [processing, setProcessing] = useState(false);

  async function downloadModule() {
    setProcessing(true);

    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .eq("id", el.id);
    console.log(data[0]);

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

export default CardDisplay;
