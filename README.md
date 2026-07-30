# LiveFact

**LiveFact** is a dynamic, time-aware benchmark for evaluating how well LLMs detect fake news under realistic, evidence-scarce conditions — introduced in our ACL 2026 paper, [*LiveFact: A Dynamic, Time-Aware Benchmark for LLM-Driven Fake News Detection*](https://aclanthology.org/2026.acl-long.546/).

Instead of testing models on stale, memorizable claims, LiveFact continuously samples real-world news events and evaluates models at multiple points in time relative to each event — before, during, and after it breaks — measuring whether a model is actually reasoning from evidence or just reciting what it memorized during pretraining.

## About this repository

This repository contains **only the source code for the LiveFact website** — the static leaderboard and benchmark landing page (`index.html`, `styles.css`, `script.js`, `data/`). It does not host the dataset itself.

- 📊 **Dataset & monthly releases:** available on [Hugging Face](https://huggingface.co/bebxy)
- 🌐 **Full benchmark details, methodology, and news:** kept up to date on the LiveFact website as new monthly evaluation rounds are released
- 📄 **Paper:** [ACL Anthology](https://aclanthology.org/2026.acl-long.546/)

## Website

The site is a static, dependency-free build (plain HTML/CSS/JS, no framework or build step) that includes:

- A live leaderboard with an Accuracy / F1-Macro toggle and Before/During/After × Classification/Inference breakdowns
- A version selector across monthly releases, sourced from `data/*.csv`
- An explanation of the benchmark's methodology and evaluation protocol
- Links to the dataset, model submission form, and paper

To run it locally:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Contributing

Contributions are welcome — bug fixes, design improvements, or new features for the leaderboard site.

- Found a bug or have a suggestion? [Open an issue](https://github.com/bebxy/livefact/issues).
- Want to submit a model for evaluation? Use the **Submit Model** link on the website.
- Interested in joining the project? Use the **Join the Team** link on the website, or reach out at [contact@bebxy.com](mailto:contact@bebxy.com).

Pull requests are welcome for anything scoped to the website itself. Dataset contributions and benchmark methodology proposals should go through the channels above rather than a PR here.

## Citation

If LiveFact is useful in your research, please cite:

```bibtex
@inproceedings{xu2026livefact,
    title = "{L}ive{F}act: A Dynamic, Time-Aware Benchmark for {LLM}-Driven Fake News Detection",
    author = "Xu, Cheng  and
      Jin, Changhong  and
      Niu, Yingjie  and
      Yan, Nan  and
      Mei, Yuke  and
      Guan, Shuhao  and
      Chen, Liming  and
      Kechadi, Tahar",
    booktitle = "Proceedings of the 64th Annual Meeting of the {A}ssociation for {C}omputational {L}inguistics (Volume 1: Long Papers)",
    month = jul,
    year = "2026",
    address = "San Diego, California, United States",
    publisher = "Association for Computational Linguistics",
    url = "https://aclanthology.org/2026.acl-long.546/",
    doi = "10.18653/v1/2026.acl-long.546",
    pages = "11881--11910"
}
```
