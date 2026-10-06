---
title: "Okjobs je sada pod MIT licencom: napravite i prodajte svoj proizvod"
canonical: "/about/"
pubDate: "2026-09-04T14:00:00.000Z"
author: Okjobs tim
description: "Okjobs sada koristi MIT licencu, pa agencije mogu da menjaju, hostuju, podlicenciraju i prodaju proizvode za AI recepciju izgrađene na našem otvorenom kodu."
categories: [Novosti o proizvodu]
---

Agencija sada može da uzme Okjobs, prilagodi ga jednom tržištu, postavi ga za klijente i naplati rezultat pod MIT licencom. Firma koja pravi proizvode može na istom kodu da izgradi sopstvenog komercijalnog AI recepcionera.

Ovu promenu smo napravili zato što Okjobs nije dostigao usvojenost proizvoda i zajednice koju smo očekivali. Želimo da softver koristi većem broju firmi, uključujući i firme koje ga kupuju preko agencija i preprodavaca koje možda nikada nećemo upoznati.

## Zašto smo promenili licencu

Okjobs je ranije koristio GNU Affero General Public License, verziju 3. AGPL podržava recipročni model za mrežni softver. Dozvoljava komercijalnu upotrebu i prodaju. Operater koji izmeni program i omogući korisnicima da ga koriste preko mreže mora tim korisnicima da ponudi odgovarajući izvorni kod pod uslovima AGPL.

Taj model služi mnogim projektima otvorenog koda. Ali je dodavao i pravnu proveru licence za agencije i produktne timove koji su želeli da izgrade komercijalnu ponudu na Okjobs. Neki timovi su želeli da rad za konkretne klijente zadrže privatnim. Drugima su trebali uslovi podlicenciranja koji odgovaraju njihovim ugovorima. Ta pitanja su stizala pre nego što su uopšte mogli da procene samog recepcionera.

Sličan problem smo imali sa prvobitnim backendom. Convex nam je pomogao da brzo napredujemo i i dalje dobro služi našim korisnicima koji plaćaju. Uvideli smo da kombinacija manje poznatog sistema i copyleft licence podiže cenu procene Okjobs za rad sa klijentima.

Usvojenost proizvoda i broj saradnika ostali su ispod našeg cilja. Odlučili smo da smanjimo oba izvora otpora. Okjobs prelazi na uobičajen sistem sa Next.js, PostgreSQL i Drizzle, a repozitorijum sada koristi MIT.

## Šta MIT licenca dozvoljava

[Okjobs licenca](/about/) svakome ko dobije softver daje dozvolu da ga koristi, kopira, menja, spaja, objavljuje, distribuira, podlicencira i prodaje.

Licenca ima jedan uslov: kopije ili značajni delovi softvera moraju da sadrže obaveštenje o autorskim pravima i dozvoli. Sadrži i standardno MIT odricanje od garancije i odgovornosti.

Za nekoga ko gradi komercijalni proizvod, to otvara široko polje upotrebe. Možete da promenite interfejs, povežete druge provajdere, dodate specijalizovane tokove rada, vodite hostovanu izvedenu verziju i sami odlučite kako naplaćujete klijentima. Pod MIT licencom možete da zadržite izmene aplikacije privatnim, uz obavezno obaveštenje u softveru koji distribuirate.

## Četiri načina da izgradite posao uz Okjobs

Okjobs već uključuje proizvodni sloj koji stoji oko AI glasovnog modela: pozive, termine, SMS poruke o zakazivanju, obaveštenja putem e-pošte i SMS poruka, znanje, transkripte, snimke, prebacivanje na čoveka, potrošnju, naplatu i kontrolnu tablu za operatere. Svoje vreme možete da posvetite klijentima i tržištu koje poznajete.

### Izgradite AI recepcionera za jednu delatnost

Tim koji radi sa stomatološkim ordinacijama može da doda pravila prijema, logiku zakazivanja i integracije za to tržište. Specijalista za kućne usluge može da se fokusira na područja rada, zahteve za ponude, usmeravanje hitnih slučajeva i raspoređivanje ekipa. Svakom proizvodu možete da date sopstveni brend i komercijalni model.

### Vodite upravljane primene za klijente

Agencija može da postavi Okjobs u sopstvenom okruženju ili na infrastrukturi koju kontroliše klijent. Naplatite podešavanje, konfiguraciju provajdera, osmišljavanje promptova i znanja, integracije, nadzor, nadogradnje i podršku.

Samostalno hostovani sistem koristi alate koje infrastrukturni timovi poznaju: Next.js, PostgreSQL, Drizzle, Redis, BullMQ, Fastify i Docker Compose. Vaš tim može da koristi sopstvene naloge za Twilio, AI kompatibilan sa OpenAI, kalendar, e-poštu, analitiku, naplatu i skladištenje.

### Prodajte integracije i osmišljavanje tokova rada

Klijenti retko imaju ista pravila zakazivanja, usmeravanja ili eskalacije. Ordinacija i servisna radionica traže različite informacije i prosleđuju posao različitim sistemima. Okjobs Vam daje osnovu recepcionera, a Vaš tim prodaje posao koji tu osnovu povezuje sa kalendarima, CRM sistemima, softverom za raspoređivanje i internim procesima.

### Vodite sopstveni hostovani proizvod

MIT licenca dozvoljava firmi da vodi posebnu hostovanu izvedenu verziju i prodaje pristup pod sopstvenim uslovima. Okjobs ne uključuje portal za preprodavce koji radi jednim klikom, pa je Vaš tim i dalje odgovoran za pakovanje ponude, podršku klijentima, naplatu provajdera, bezbednost i rad sistema. Kod daje osnovu proizvoda za recepciju, a Vaš tim daje komercijalnu uslugu oko nje.

## Na kodu možete da izgradite svoj brend

MIT licenca pokriva Okjobs kod i prateću dokumentaciju. Ne daje neograničena prava na ime Okjobs, logotipe ili vizuelni identitet.

Proizvod izgrađen na kodu možete da preimenujete i prodajete pod sopstvenim imenom. Zadržite obavezno MIT obaveštenje uz kopije ili značajne delove i koristite sopstveni brend za komercijalnu ponudu.

Ovakvo razdvajanje pomaže klijentima da razumeju ko vodi uslugu. Vaša firma je vlasnik primene, odnosa podrške, cena, naloga kod provajdera i obećanja koja daje klijentima. Okjobs ostaje ime našeg projekta i naše hostovane usluge.

## Hostovani proizvod ostaje dostupan

Otvoreni kod daje kontrolu agencijama i tehničkim timovima. Mnoge firme žele da neko drugi vodi infrastrukturu, prati provajdere, objavljuje nadogradnje i pruža podršku za proizvod.

[Okjobs Cloud](/about/) ostaje upravljana opcija za te korisnike. Oni mogu da podese recepcionera, znanje o firmi, pravila, brojeve telefona i Google Calendar bez vođenja PostgreSQL, Redis ili glasovnog gateway servisa.

Agencije mogu da izaberu model koji odgovara svakom angažmanu. Koristite MIT kod kada klijentu treba proizvod pod njegovim brendom, prilagođena infrastruktura ili obimne integracije. Koristite Okjobs Cloud kada klijent želi upravljani proizvod, a Vaša vrednost dolazi od podešavanja, osmišljavanja tokova rada i stalne usluge.

## Napravite ponudu koja treba Vašim klijentima

AGPL smo izabrali zbog recipročnog modela dok smo gradili prvu verziju. MIT smo izabrali da olakšamo komercijalno usvajanje i pomognemo većem broju graditelja da Okjobs odnesu na tržišta do kojih sami ne možemo da stignemo.

[Klonirajte Okjobs sa GitHuba](/about/), pročitajte [pregled samostalnog hostovanja](/about/) i koristite [vodič za Docker Compose](/about/) za prvu primenu. Prateći tekst objašnjava [zašto Okjobs napušta Convex](/sr/blog/why-lobbystack-is-moving-away-from-convex/).

Ako radije želite da počnete sa upravljanim proizvodom, [napravite Okjobs Cloud nalog](/signup) i testirajte poziv u pregledaču pre nego što ga ponudite klijentu.
