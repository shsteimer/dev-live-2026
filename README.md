# dev-live-2026

Demo site for Sean Steimer's AEM Dev Live 2026 talk: a top-10 countdown of EDS Masterclass questions. Fictional brand: Vela Sports Group.

## Environments
- Preview: https://main--dev-live-2026--shsteimer.aem.page/
- Live: https://main--dev-live-2026--shsteimer.aem.live/
- Authoring: https://da.live/#/shsteimer/dev-live-2026

## Develop
```sh
npm i
npx -y @adobe/aem-cli up
npm run lint
```

## Content
```sh
aem content clone --all
aem content add . && aem content commit -m "..." && aem content push
```
