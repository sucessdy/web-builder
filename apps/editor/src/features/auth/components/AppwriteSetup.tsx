import authConfig from "../auth.config.json";

export function AppwriteSetup() {
  return (
    <main className={authConfig.styles.screen}>
      <section className={authConfig.styles.card} role="status">
        <div className={authConfig.styles.brandMark}>
          <span className={authConfig.styles.brandMarkInner} />
        </div>
        <div className={authConfig.styles.kicker}>
          {authConfig.copy.setupKicker}
        </div>
        <h1 className={authConfig.styles.title}>
          {authConfig.copy.setupTitle}
        </h1>
        <p className={authConfig.styles.description}>
          {authConfig.copy.setupDescription}
        </p>
        <div className={authConfig.styles.message}>
          {authConfig.copy.setupMessage}
        </div>
      </section>
    </main>
  );
}
