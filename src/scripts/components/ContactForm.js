const TEXTES = {
  fr: {
    'contact-prenom': { vide: 'Entrez votre prénom.' },
    'contact-nom': { vide: 'Entrez votre nom.' },
    'contact-courriel': {
      vide: 'Entrez votre adresse courriel.',
      format:
        'Entrez une adresse courriel valide, par exemple vous@exemple.com.',
    },
    'contact-telephone': {
      format: 'Entrez un numéro à 10 chiffres, par exemple (514) 555-1234.',
    },
    'contact-message': { vide: 'Écrivez votre message.' },
    envoi: 'Envoi en cours…',
    echec:
      "Le message n'a pas pu être envoyé. Réessayez dans quelques instants.",
  },
  en: {
    'contact-prenom': { vide: 'Please enter your first name.' },
    'contact-nom': { vide: 'Please enter your last name.' },
    'contact-courriel': {
      vide: 'Please enter your email address.',
      format:
        'Please enter a valid email address, for example you@example.com.',
    },
    'contact-telephone': {
      format:
        'Please enter a 10-digit phone number, for example (514) 555-1234.',
    },
    'contact-message': { vide: 'Please write your message.' },
    envoi: 'Sending…',
    echec: 'Your message could not be sent. Please try again in a few moments.',
  },
};

const langue = document.documentElement.lang === 'en' ? 'en' : 'fr';
const MESSAGES = TEXTES[langue];

export default class ContactForm {
  constructor(element) {
    this.element = element;
    this.endpoint = element.getAttribute('action');
    this.champs = element.querySelector('.contact-form__champs');
    this.bouton = element.querySelector('.contact-form__bouton');
    this.statut = element.querySelector('.contact-form__statut');
    this.succes = element.querySelector('.contact-form__succes');
    this.prenomSucces = element.querySelector('.contact-form__prenom');
    this.boutonNouveau = element.querySelector('.contact-form__nouveau');
    this.texteBouton = this.bouton.textContent;

    // Tous les champs à valider (ceux qui ont un message d'erreur)
    this.champsAValider = [
      ...element.querySelectorAll('input, textarea'),
    ].filter((champ) => MESSAGES[champ.id]);

    this.init();
  }

  init() {
    this.element.addEventListener('submit', this.envoyer.bind(this));
    this.boutonNouveau.addEventListener('click', this.recommencer.bind(this));

    this.champsAValider.forEach((champ) => {
      // En tapant : on met à jour l'erreur seulement si elle est déjà affichée
      champ.addEventListener('input', () => this.validerChamp(champ, false));
      // En quittant le champ : on affiche l'erreur s'il y en a une
      champ.addEventListener('blur', () => {
        if (champ.value.trim() !== '') this.validerChamp(champ, true);
      });
    });
  }

  /**
   * Retourne le message d'erreur d'un champ, ou une chaîne vide s'il est valide.
   */
  trouverErreur(champ) {
    const valeur = champ.value.trim();
    const messages = MESSAGES[champ.id];

    if (valeur === '') {
      return champ.required ? messages.vide : '';
    }

    if (champ.type === 'email') {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valeur)
        ? ''
        : messages.format;
    }

    if (champ.type === 'tel') {
      return this.chiffresTelephone(valeur) ? '' : messages.format;
    }

    return '';
  }

  /**
   * Numéro nord-américain à 10 chiffres.
   * Accepte : 5145551234, 514-555-1234, (514) 555-1234, 514.555.1234, +1 514 555 1234
   * Retourne les 10 chiffres, ou null si le numéro est invalide.
   */
  chiffresTelephone(valeur) {
    let chiffres = valeur.replace(/\D/g, '');

    // Retire l'indicatif du pays (+1 ou 1)
    if (chiffres.length === 11 && chiffres.startsWith('1')) {
      chiffres = chiffres.slice(1);
    }

    // L'indicatif régional et le central ne commencent jamais par 0 ou 1
    return /^[2-9]\d{2}[2-9]\d{6}$/.test(chiffres) ? chiffres : null;
  }

  /**
   * Valide un champ et met à jour son message d'erreur.
   * @param {HTMLElement} champ
   * @param {boolean} afficher Affiche l'erreur (sinon, on ne fait que l'effacer quand le champ devient valide)
   * @returns {boolean} true si le champ est valide
   */
  validerChamp(champ, afficher) {
    const message = this.trouverErreur(champ);
    const erreur = this.element.querySelector(`#${champ.id}-erreur`);
    const dejaAffichee = !erreur.hidden;

    // Met le téléphone au format (514) 555-1234 quand on quitte le champ
    if (
      champ.type === 'tel' &&
      afficher &&
      !message &&
      champ.value.trim() !== ''
    ) {
      const c = this.chiffresTelephone(champ.value);
      champ.value = `(${c.slice(0, 3)}) ${c.slice(3, 6)}-${c.slice(6)}`;
    }

    if (afficher || dejaAffichee) {
      erreur.textContent = message;
      erreur.hidden = !message;
      champ.setAttribute('aria-invalid', String(Boolean(message)));
    }

    return !message;
  }

  /**
   * Valide tous les champs et place le curseur sur le premier en erreur.
   */
  validerTout() {
    const invalides = this.champsAValider.filter(
      (champ) => !this.validerChamp(champ, true),
    );
    if (invalides.length) invalides[0].focus();
    return invalides.length === 0;
  }

  effacerErreurs() {
    this.champsAValider.forEach((champ) => {
      const erreur = this.element.querySelector(`#${champ.id}-erreur`);
      erreur.textContent = '';
      erreur.hidden = true;
      champ.removeAttribute('aria-invalid');
    });
  }

  async envoyer(event) {
    // Empêche le navigateur d'ouvrir la page de Web3Forms
    event.preventDefault();

    if (!this.validerTout()) {
      this.afficherStatut('');
      return;
    }

    const donnees = Object.fromEntries(new FormData(this.element));

    // Champ piège : seuls les robots le cochent
    if (donnees.botcheck) return;
    delete donnees.botcheck;

    const prenom = donnees['Prénom'].trim();
    const nom = donnees['Nom'].trim();

    // Nom de l'expéditeur affiché dans la boîte de courriel
    donnees.from_name = `Nouveau message de ${prenom} ${nom}`;

    // On n'envoie pas le téléphone s'il est vide
    if (!donnees['Téléphone'].trim()) delete donnees['Téléphone'];

    this.chargement(true);
    this.afficherStatut('');

    try {
      const reponse = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(donnees),
      });
      const resultat = await reponse.json();

      if (!reponse.ok || !resultat.success) {
        throw new Error(resultat.message);
      }

      this.afficherSucces(prenom);
    } catch (erreur) {
      this.afficherStatut(MESSAGES.echec, true);
    } finally {
      this.chargement(false);
    }
  }

  chargement(actif) {
    this.bouton.disabled = actif;
    this.bouton.textContent = actif ? MESSAGES.envoi : this.texteBouton;
  }

  afficherStatut(message, erreur = false) {
    this.statut.textContent = message;
    this.statut.classList.toggle('is-erreur', erreur);
  }

  afficherSucces(prenom) {
    this.element.reset();
    this.effacerErreurs();
    this.prenomSucces.textContent = prenom;
    this.champs.hidden = true;
    this.succes.hidden = false;
    this.succes.querySelector('h3').focus();
  }

  recommencer() {
    this.succes.hidden = true;
    this.champs.hidden = false;
    this.champsAValider[0].focus();
  }
}
