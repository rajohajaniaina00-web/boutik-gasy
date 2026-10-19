
import { useEffect, useMemo, useState } from "react";
import "./index.css";

const API = "http://127.0.0.1:8000/api";
const MEDIA = "http://127.0.0.1:8000";

const EMPTY_AUTH = {
  username: "",
  email: "",
  password: "",
  first_name: "",
  last_name: "",
};

const EMPTY_CHECKOUT = {
  full_name: "",
  phone: "",
  address: "",
  notes: "",
};

function getErrorMessage(data, fallback) {
  if (data?.detail) return data.detail;

  if (data && typeof data === "object") {
    const messages = Object.values(data)
      .flat(Infinity)
      .filter((value) => typeof value === "string");

    if (messages.length) return messages.join(" ");
  }

  return fallback;
}

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString("fr-FR")} Ar`;
}

function getImageUrl(image) {
  if (!image) return "";

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `${MEDIA}${image.startsWith("/") ? "" : "/"}${image}`;
}

function getProductId(item) {
  return item.id ?? item.product_id;
}

function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tout");

  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [notice, setNotice] = useState("");

  const [token, setToken] = useState(
    () => localStorage.getItem("boutik_token") || ""
  );

  const [accountOpen, setAccountOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState(EMPTY_AUTH);
  const [busy, setBusy] = useState(false);
  const [authUser, setAuthUser] = useState(null);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState(EMPTY_CHECKOUT);

  // Charger les produits et les catégories.
  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setLoading(true);
      setApiError("");

      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch(`${API}/products/`),
          fetch(`${API}/categories/`),
        ]);

        if (!productsResponse.ok) {
          throw new Error("Impossible de charger les produits.");
        }

        const productsData = await productsResponse.json();

        if (!categoriesResponse.ok) {
          throw new Error("Impossible de charger les catégories.");
        }

        const categoriesData = await categoriesResponse.json();

        if (cancelled) return;

        const productList = Array.isArray(productsData)
          ? productsData
          : productsData.results || [];

        const categoryList = Array.isArray(categoriesData)
          ? categoriesData
          : categoriesData.results || [];

        setProducts(productList);
        setCategories(categoryList);
      } catch (error) {
        if (!cancelled) {
          setApiError(
            error.message ||
              "Le serveur est inaccessible. Vérifie que Django fonctionne."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  // Récupérer le profil lorsque l'utilisateur possède un token.
  useEffect(() => {
    if (!token) {
      setAuthUser(null);
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch(`${API}/auth/profile/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("boutik_token");
          if (!cancelled) {
            setToken("");
            setAuthUser(null);
          }
          return;
        }

        if (!response.ok) return;

        const data = await response.json();

        if (!cancelled) setAuthUser(data);
      } catch {
        // Le profil sera rechargé lors d'une prochaine tentative.
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const categorySlug =
        typeof product.category === "object"
          ? product.category?.slug
          : product.category;

      const categoryName =
        typeof product.category === "object"
          ? product.category?.name
          : "";

      const matchesCategory =
        activeCategory === "Tout" ||
        categorySlug === activeCategory ||
        categoryName === activeCategory;

      const matchesSearch =
        !query ||
        [
          product.name,
          product.description,
          categoryName,
          categorySlug,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [products, search, activeCategory]);

  const featuredProducts = useMemo(
    () => products.filter((product) => product.is_featured).slice(0, 4),
    [products]
  );

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) => total + Number(item.price || 0) * item.quantity,
    0
  );

  function addToCart(product) {
    if (Number(product.stock) <= 0) {
      setNotice("Ce produit est actuellement en rupture de stock.");
      return;
    }

    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => getProductId(item) === product.id
      );

      if (existing) {
        if (existing.quantity >= Number(product.stock)) {
          setNotice("La quantité demandée dépasse le stock disponible.");
          return currentCart;
        }

        return currentCart.map((item) =>
          getProductId(item) === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...currentCart, { ...product, quantity: 1 }];
    });

    setCartOpen(true);
  }

  function changeQuantity(productId, amount) {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (getProductId(item) !== productId) return item;

          const nextQuantity = item.quantity + amount;
          const maxStock = Number(item.stock);

          if (nextQuantity > maxStock) {
            setNotice("La quantité demandée dépasse le stock disponible.");
            return item;
          }

          return { ...item, quantity: nextQuantity };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(productId) {
    setCart((currentCart) =>
      currentCart.filter((item) => getProductId(item) !== productId)
    );
  }

  function updateAuthField(event) {
    const { name, value } = event.target;

    setAuthForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateCheckoutField(event) {
    const { name, value } = event.target;

    setCheckoutForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function submitAuth(event) {
    event.preventDefault();
    setBusy(true);
    setNotice("");

    try {
      const registering = authMode === "register";

      const response = await fetch(
        `${API}/auth/${registering ? "register" : "login"}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            registering
              ? authForm
              : {
                  username: authForm.username,
                  password: authForm.password,
                }
          ),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Connexion ou inscription impossible.")
        );
      }

      if (!data.token) {
        throw new Error("Le serveur n'a pas retourné de jeton de connexion.");
      }

      localStorage.setItem("boutik_token", data.token);
      setToken(data.token);
      setAuthUser(data.user || null);
      setAuthForm(EMPTY_AUTH);
      setAccountOpen(false);
      setNotice(
        registering
          ? "Ton compte a été créé avec succès."
          : "Connexion réussie."
      );
    } catch (error) {
      setNotice(error.message || "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);

    try {
      if (token) {
        await fetch(`${API}/auth/logout/`, {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
          },
        });
      }
    } catch {
      // La session locale est fermée même si le serveur est indisponible.
    } finally {
      localStorage.removeItem("boutik_token");
      setToken("");
      setAuthUser(null);
      setAccountOpen(false);
      setBusy(false);
      setNotice("Tu es maintenant déconnecté.");
    }
  }

  async function submitOrder(event) {
    event.preventDefault();
    setNotice("");

    if (!token) {
      setCheckoutOpen(false);
      setAuthMode("login");
      setAccountOpen(true);
      setNotice("Connecte-toi avant de confirmer ta commande.");
      return;
    }

    if (cart.length === 0) {
      setNotice("Ton panier est vide.");
      return;
    }

    if (
      !checkoutForm.full_name.trim() ||
      !checkoutForm.phone.trim() ||
      !checkoutForm.address.trim()
    ) {
      setNotice("Remplis ton nom, ton téléphone et ton adresse.");
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(`${API}/orders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          ...checkoutForm,
          items: cart.map((item) => ({
            product_id: getProductId(item),
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("boutik_token");
          setToken("");
          setAuthUser(null);
        }

        throw new Error(
          getErrorMessage(data, "Impossible de créer la commande.")
        );
      }

      const order = data.order || data;
      const orderId = order.id;

      setCart([]);
      setCheckoutForm(EMPTY_CHECKOUT);
      setCheckoutOpen(false);
      setCartOpen(false);
      setNotice(
        orderId
          ? `Commande #${orderId} enregistrée avec succès.`
          : "Ta commande a été enregistrée avec succès."
      );

      // Actualiser le stock affiché dans le catalogue.
      try {
        const refresh = await fetch(`${API}/products/`);
        if (refresh.ok) {
          const refreshedData = await refresh.json();
          setProducts(
            Array.isArray(refreshedData)
              ? refreshedData
              : refreshedData.results || []
          );
        }
      } catch {
        // La commande est déjà enregistrée.
      }
    } catch (error) {
      setNotice(error.message || "Erreur lors de la commande.");
    } finally {
      setBusy(false);
    }
  }

  function openCheckout() {
    if (cart.length === 0) {
      setNotice("Ajoute au moins un produit dans ton panier.");
      return;
    }

    if (!token) {
      setAuthMode("login");
      setAccountOpen(true);
      setNotice("Connecte-toi pour poursuivre ta commande.");
      return;
    }

    setCheckoutOpen(true);
  }

  function scrollToProducts() {
    document.getElementById("boutique")?.scrollIntoView({
      behavior: "smooth",
    });
  }

  return (
    <div className="app">
      <div className="announcement">
        <p>Bienvenue chez Boutik Gasy — Les produits d’ici, chez vous.</p>
      </div>

      <header className="site-header">
        <a className="brand" href="#accueil" aria-label="Boutik Gasy, accueil">
          <span className="brand-mark">BG</span>
          <span className="brand-copy">
            <strong>Boutik Gasy</strong>
            <small>Le meilleur de Madagascar</small>
          </span>
        </a>

        <nav className="main-nav" aria-label="Navigation principale">
          <a href="#accueil">Accueil</a>
          <a href="#boutique">Boutique</a>
          <a href="#histoire">Notre histoire</a>
          <a href="#contact">Contact</a>
        </nav>

        <div className="header-actions">
          <button
            className="button-outline"
            type="button"
            onClick={() => setAccountOpen(true)}
          >
            {token ? "Mon compte" : "Connexion"}
          </button>

          <button
            className="cart-button"
            type="button"
            onClick={() => setCartOpen(true)}
          >
            <span aria-hidden="true">♧</span>
            Panier
            <span className="cart-count">{cartCount}</span>
          </button>
        </div>
      </header>

      <main>
        <section className="hero" id="accueil">
          <div className="hero-content">
            <span className="eyebrow">MITSANGANA NY VITA GASY</span>
            <h1>
              Madagascar
              <br />
              <em>dans votre quotidien.</em>
            </h1>
            <p>
              Découvrez une sélection de produits inspirés du savoir-faire
              malgache, choisis avec soin et proposés directement dans notre
              boutique en ligne.
            </p>

            <div className="hero-actions">
              <button
                className="button-primary"
                type="button"
                onClick={scrollToProducts}
              >
                Découvrir la boutique ↗
              </button>
              <a className="text-link" href="#histoire">
                Notre histoire
              </a>
            </div>

            <div className="hero-note">
              <span aria-hidden="true">✳</span>
              Une boutique locale, une passion malgache.
            </div>
          </div>

          <div className="hero-visual" aria-label="Sélection de produits">
            <div className="hero-image-frame">
              {products.find((product) => product.is_featured)?.image ? (
                <img
                  src={getImageUrl(
                    products.find((product) => product.is_featured).image
                  )}
                  alt="Produit vedette de Boutik Gasy"
                />
              ) : (
                <div className="hero-placeholder">
                  <span>VITA GASY</span>
                  <strong>Ny tsara indrindra</strong>
                  <span>✳</span>
                </div>
              )}
            </div>
            <div className="hero-sticker">
              <span>Nos coups</span>
              <strong>de cœur</strong>
              <span aria-hidden="true">✳</span>
            </div>
          </div>
        </section>

        <section className="values-strip" aria-label="Nos engagements">
          <div>
            <span aria-hidden="true">✳</span>
            <p>
              <strong>Authentique</strong>
              <small>Des produits sélectionnés</small>
            </p>
          </div>
          <div>
            <span aria-hidden="true">♡</span>
            <p>
              <strong>Local</strong>
              <small>Une passion malgache</small>
            </p>
          </div>
          <div>
            <span aria-hidden="true">◇</span>
            <p>
              <strong>Simple</strong>
              <small>Une commande en quelques clics</small>
            </p>
          </div>
          <div>
            <span aria-hidden="true">↗</span>
            <p>
              <strong>Proche de vous</strong>
              <small>À votre écoute</small>
            </p>
          </div>
        </section>

        {featuredProducts.length > 0 && (
          <section className="featured-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">LA SÉLECTION BOUTIK GASY</span>
                <h2>Nos coups de cœur</h2>
              </div>
              <button
                className="text-link"
                type="button"
                onClick={scrollToProducts}
              >
                Voir tous les produits ↗
              </button>
            </div>

            <div className="product-grid">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={addToCart}
                />
              ))}
            </div>
          </section>
        )}

        <section className="shop-section" id="boutique">
          <div className="section-heading">
            <div>
              <span className="eyebrow">FAITES VOTRE CHOIX</span>
              <h2>La boutique</h2>
              <p>Des produits à découvrir, à aimer et à partager.</p>
            </div>

            <label className="search-box">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Rechercher un produit..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Rechercher un produit"
              />
            </label>
          </div>

          <div className="category-list">
            <button
              type="button"
              className={activeCategory === "Tout" ? "active" : ""}
              onClick={() => setActiveCategory("Tout")}
            >
              Tout
            </button>

            {categories.map((category) => (
              <button
                type="button"
                key={category.id ?? category.slug ?? category.name}
                className={
                  activeCategory === (category.slug || category.name)
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveCategory(category.slug || category.name)
                }
              >
                {category.name}
              </button>
            ))}
          </div>

          {apiError && (
            <div className="catalog-message" role="alert">
              {apiError}
              <button
                type="button"
                onClick={() => window.location.reload()}
              >
                Réessayer
              </button>
            </div>
          )}

          {loading ? (
            <div className="catalog-message">Chargement des produits...</div>
          ) : filteredProducts.length > 0 ? (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={addToCart}
                />
              ))}
            </div>
          ) : (
            <div className="empty-products">
              <span aria-hidden="true">⌕</span>
              <h3>Aucun produit trouvé</h3>
              <p>Essaie une autre recherche ou une autre catégorie.</p>
              <button
                type="button"
                className="button-outline"
                onClick={() => {
                  setSearch("");
                  setActiveCategory("Tout");
                }}
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </section>

        <section className="story-section" id="histoire">
          <div className="story-decoration" aria-hidden="true">
            ✳
          </div>
          <div className="story-content">
            <span className="eyebrow">NY ANTSIKA, NY FIREHETSIKA</span>
            <h2>
              Le savoir-faire
              <br />
              malgache nous rassemble.
            </h2>
            <p>
              Boutik Gasy est une invitation à découvrir les produits et les
              talents de Madagascar. Nous souhaitons rendre ces découvertes
              accessibles et vous offrir une expérience d’achat simple et
              agréable.
            </p>
            <a className="text-link" href="#boutique">
              Explorer les produits ↗
            </a>
          </div>
        </section>

        <section className="newsletter-section">
          <span className="eyebrow">RESTONS EN CONTACT</span>
          <h2>La boutique est toujours ouverte.</h2>
          <p>
            Parcourez nos produits et contactez-nous pour toute question
            concernant votre commande.
          </p>
          <a className="button-primary" href="#contact">
            Nous contacter ↗
          </a>
        </section>
      </main>

      <footer className="site-footer" id="contact">
        <div className="footer-main">
          <a className="brand footer-brand" href="#accueil">
            <span className="brand-mark">BG</span>
            <span className="brand-copy">
              <strong>Boutik Gasy</strong>
              <small>Le meilleur de Madagascar</small>
            </span>
          </a>

          <p>
            Une boutique en ligne inspirée par Madagascar et son savoir-faire.
          </p>

          <div className="footer-links">
            <a href="#accueil">Accueil</a>
            <a href="#boutique">Boutique</a>
            <a href="#histoire">Notre histoire</a>
            <a href="mailto:contact@boutikgasy.mg">Nous écrire</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Boutik Gasy</span>
          <span>Fait avec soin à Madagascar 🇲🇬</span>
        </div>
      </footer>

      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button
            type="button"
            aria-label="Fermer le message"
            onClick={() => setNotice("")}
          >
            ×
          </button>
        </div>
      )}

      {/* Fenêtre de connexion et d'inscription */}
      {accountOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) {
              setAccountOpen(false);
            }
          }}
        >
          <section
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-title"
          >
            <button
              className="modal-close"
              type="button"
              aria-label="Fermer"
              onClick={() => setAccountOpen(false)}
              disabled={busy}
            >
              ×
            </button>

            {token ? (
              <>
                <span className="eyebrow">VOTRE ESPACE</span>
                <h2 id="account-title">Mon compte</h2>
                <p>
                  {authUser?.first_name || authUser?.username
                    ? `Bienvenue, ${
                        authUser.first_name || authUser.username
                      } !`
                    : "Tu es connecté à ton compte Boutik Gasy."}
                </p>

                {authUser?.email && (
                  <p className="account-email">{authUser.email}</p>
                )}

                <button
                  className="button-primary full-button"
                  type="button"
                  onClick={() => {
                    setAccountOpen(false);
                    setCartOpen(true);
                  }}
                >
                  Voir mon panier
                </button>

                <button
                  className="button-outline full-button"
                  type="button"
                  onClick={logout}
                  disabled={busy}
                >
                  {busy ? "Déconnexion..." : "Se déconnecter"}
                </button>
              </>
            ) : (
              <>
                <span className="eyebrow">BIENVENUE CHEZ BOUTIK GASY</span>
                <h2 id="account-title">
                  {authMode === "login" ? "Content de te revoir." : "Créer un compte"}
                </h2>
                <p>
                  {authMode === "login"
                    ? "Connecte-toi pour poursuivre tes achats."
                    : "Inscris-toi pour pouvoir passer commande."}
                </p>

                <div className="auth-tabs">
                  <button
                    type="button"
                    className={authMode === "login" ? "active" : ""}
                    onClick={() => setAuthMode("login")}
                    disabled={busy}
                  >
                    Connexion
                  </button>
                  <button
                    type="button"
                    className={authMode === "register" ? "active" : ""}
                    onClick={() => setAuthMode("register")}
                    disabled={busy}
                  >
                    Inscription
                  </button>
                </div>

                <form className="modal-form" onSubmit={submitAuth}>
                  {authMode === "register" && (
                    <>
                      <label>
                        Prénom
                        <input
                          name="first_name"
                          value={authForm.first_name}
                          onChange={updateAuthField}
                          autoComplete="given-name"
                        />
                      </label>

                      <label>
                        Nom
                        <input
                          name="last_name"
                          value={authForm.last_name}
                          onChange={updateAuthField}
                          autoComplete="family-name"
                        />
                      </label>

                      <label>
                        Adresse e-mail
                        <input
                          name="email"
                          type="email"
                          value={authForm.email}
                          onChange={updateAuthField}
                          required
                          autoComplete="email"
                        />
                      </label>
                    </>
                  )}

                  <label>
                    {authMode === "login"
                      ? "Nom d’utilisateur ou e-mail"
                      : "Nom d’utilisateur"}
                    <input
                      name="username"
                      value={authForm.username}
                      onChange={updateAuthField}
                      required
                      autoComplete="username"
                    />
                  </label>

                  <label>
                    Mot de passe
                    <input
                      name="password"
                      type="password"
                      value={authForm.password}
                      onChange={updateAuthField}
                      required
                      minLength={8}
                      autoComplete={
                        authMode === "login"
                          ? "current-password"
                          : "new-password"
                      }
                    />
                  </label>

                  <button
                    className="button-primary full-button"
                    type="submit"
                    disabled={busy}
                  >
                    {busy
                      ? "Patiente un instant..."
                      : authMode === "login"
                        ? "Se connecter"
                        : "Créer mon compte"}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      )}

      {/* Fenêtre de validation de commande */}
      {checkoutOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) {
              setCheckoutOpen(false);
            }
          }}
        >
          <section
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
          >
            <button
              className="modal-close"
              type="button"
              aria-label="Fermer"
              onClick={() => setCheckoutOpen(false)}
              disabled={busy}
            >
              ×
            </button>

            <span className="eyebrow">DERNIÈRE ÉTAPE</span>
            <h2 id="checkout-title">Finaliser ma commande</h2>
            <p>Vérifie tes coordonnées avant de confirmer.</p>

            <div className="checkout-summary">
              <span>{cartCount} article(s)</span>
              <strong>{formatPrice(cartTotal)}</strong>
            </div>

            <form className="modal-form" onSubmit={submitOrder}>
              <label>
                Nom complet
                <input
                  name="full_name"
                  value={checkoutForm.full_name}
                  onChange={updateCheckoutField}
                  required
                  autoComplete="name"
                />
              </label>

              <label>
                Téléphone
                <input
                  name="phone"
                  type="tel"
                  value={checkoutForm.phone}
                  onChange={updateCheckoutField}
                  required
                  autoComplete="tel"
                  placeholder="Ex. : 034 00 000 00"
                />
              </label>

              <label>
                Adresse de livraison
                <textarea
                  name="address"
                  value={checkoutForm.address}
                  onChange={updateCheckoutField}
                  required
                  rows={3}
                  autoComplete="street-address"
                  placeholder="Ville, quartier, adresse..."
                />
              </label>

              <label>
                Note complémentaire (facultatif)
                <textarea
                  name="notes"
                  value={checkoutForm.notes}
                  onChange={updateCheckoutField}
                  rows={2}
                  placeholder="Précisions pour la livraison..."
                />
              </label>

              <p className="checkout-disclaimer">
                Le montant est calculé à partir des prix enregistrés sur le
                serveur. Aucun paiement en ligne n’est effectué par ce
                formulaire.
              </p>

              <button
                className="button-primary full-button"
                type="submit"
                disabled={busy || cart.length === 0}
              >
                {busy ? "Enregistrement..." : "Confirmer la commande ↗"}
              </button>
            </form>
          </section>
        </div>
      )}

      {/* Panier */}
      {cartOpen && (
        <div
          className="cart-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setCartOpen(false);
            }
          }}
        >
          <aside
            className="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
          >
            <div className="cart-header">
              <div>
                <span className="eyebrow">VOTRE SÉLECTION</span>
                <h2 id="cart-title">Mon panier ({cartCount})</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                aria-label="Fermer le panier"
                onClick={() => setCartOpen(false)}
              >
                ×
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="cart-empty">
                <span aria-hidden="true">♧</span>
                <h3>Ton panier est vide.</h3>
                <p>Découvre nos produits et ajoute tes coups de cœur.</p>
                <button
                  className="button-primary full-button"
                  type="button"
                  onClick={() => {
                    setCartOpen(false);
                    scrollToProducts();
                  }}
                >
                  Explorer la boutique
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <article
                      className="cart-item"
                      key={getProductId(item)}
                    >
                      <div className="cart-item-image">
                        {item.image ? (
                          <img
                            src={getImageUrl(item.image)}
                            alt={item.name}
                          />
                        ) : (
                          <span aria-hidden="true">✳</span>
                        )}
                      </div>

                      <div className="cart-item-details">
                        <h3>{item.name}</h3>
                        <strong>{formatPrice(item.price)}</strong>

                        <div className="quantity-controls">
                          <button
                            type="button"
                            aria-label={`Diminuer la quantité de ${item.name}`}
                            onClick={() =>
                              changeQuantity(getProductId(item), -1)
                            }
                          >
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            aria-label={`Augmenter la quantité de ${item.name}`}
                            onClick={() =>
                              changeQuantity(getProductId(item), 1)
                            }
                            disabled={item.quantity >= Number(item.stock)}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        className="remove-item"
                        type="button"
                        onClick={() => removeFromCart(getProductId(item))}
                        aria-label={`Retirer ${item.name} du panier`}
                      >
                        Retirer
                      </button>
                    </article>
                  ))}
                </div>

                <div className="cart-footer">
                  <div className="cart-total">
                    <span>Total estimé</span>
                    <strong>{formatPrice(cartTotal)}</strong>
                  </div>
                  <p>
                    Les prix et disponibilités sont vérifiés lors de la
                    création de la commande.
                  </p>
                  <button
                    className="button-primary full-button"
                    type="button"
                    onClick={openCheckout}
                  >
                    Continuer vers la commande ↗
                  </button>
                  <button
                    className="button-outline full-button"
                    type="button"
                    onClick={() => setCartOpen(false)}
                  >
                    Continuer mes achats
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onAdd }) {
  const imageUrl = getImageUrl(product.image);
  const stock = Number(product.stock || 0);
  const categoryName =
    typeof product.category === "object"
      ? product.category?.name
      : "";

  return (
    <article className="product-card">
      <div className="product-image">
        {product.is_featured && (
          <span className="product-badge">Coup de cœur</span>
        )}

        {imageUrl ? (
          <img src={imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <div className="product-placeholder" aria-label="Image indisponible">
            <span aria-hidden="true">✳</span>
            <small>Boutik Gasy</small>
          </div>
        )}
      </div>

      <div className="product-info">
        {categoryName && <span className="product-category">{categoryName}</span>}
        <h3>{product.name}</h3>

        {product.description && <p>{product.description}</p>}

        <div className="product-bottom">
          <strong className="product-price">{formatPrice(product.price)}</strong>
          <button
            className="add-to-cart"
            type="button"
            onClick={() => onAdd(product)}
            disabled={stock <= 0}
            aria-label={`Ajouter ${product.name} au panier`}
          >
            {stock <= 0 ? "Épuisé" : "Ajouter +"}
          </button>
        </div>

        <small className="stock-label">
          {stock > 0 ? `${stock} disponible(s)` : "Rupture de stock"}
        </small>
      </div>
    </article>
  );
}

export default App;
