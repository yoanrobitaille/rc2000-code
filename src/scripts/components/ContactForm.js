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

    this.init();
  }

  init() {
    this.element.addEventListener('submit', this.envoyer.bind(this));
    this.boutonNouveau.addEventListener('click', this.recommencer.bind(this));
  }

  async envoyer(event) {
    // Empêche le navigateur d'ouvrir la page de Web3Forms
    event.preventDefault();

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
      this.afficherStatut("Le message n'a pas pu être envoyé. Réessayez dans quelques instants.", true);
    } finally {
      this.chargement(false);
    }
  }

  chargement(actif) {
    this.bouton.disabled = actif;
    this.bouton.textContent = actif ? 'Envoi en cours…' : this.texteBouton;
  }

  afficherStatut(message, erreur = false) {
    this.statut.textContent = message;
    this.statut.classList.toggle('is-erreur', erreur);
  }

  afficherSucces(prenom) {
    this.element.reset();
    this.prenomSucces.textContent = prenom;
    this.champs.hidden = true;
    this.succes.hidden = false;
    this.succes.querySelector('h3').focus();
  }

  recommencer() {
    this.succes.hidden = true;
    this.champs.hidden = false;
    this.element.querySelector('input:not([type="hidden"], [type="checkbox"])').focus();
  }
}
