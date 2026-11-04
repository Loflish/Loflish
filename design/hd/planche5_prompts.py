"""
Planche 5 « filaments de lumière » (4 novembre 2026) : écrit design/planche-5-lumiere.json, les 100 prompts prêts pour
Nano Banana 2.1. Même structure que planche-4-gothique.json (gabarit, fils, fonds, bulles), mais la direction a changé :
la manière de Beksiński (tout est tissé de lignes, bords perdus, une seule présence) et des filaments fumés, avec la
lumière et la joie de GRIS : le papier est la lumière, aucune masse noire. Matière en gris neutre, teintée ensuite.

  python design/hd/planche5_prompts.py
"""
import json
from pathlib import Path

RACINE = Path(__file__).resolve().parents[2]
p4 = json.loads((RACINE / 'design' / 'planche-4-gothique.json').read_text(encoding='utf-8'))
# les fils vérifiés de la planche 4 qui tiennent sur un fond clair (sources dans design/planche-4-gothique.md)
fils = {k: v for k, v in p4['fils'].items() if k in ('sec', 'brume', 'tremble', 'branche', 'boucle', 'eau', 'flottant', 'botte', 'fouet', 'chanvre', 'pendu', 'rayon', 'une', 'flamme', 'etoile')}
fils['soie'] = 'thousands of long thin ink lines, fine as spider silk, drawn slowly with a pen, tapering and fading away, dark grey and smoky'
fils['reserve'] = 'pale filaments left in reserve, bright paper lines inside a soft grey veil, like a print of light'
fils['fumee'] = 'long filaments of smoke, fine and dark, rising slowly and bending in the air, each one separate from the others'
GABARIT = (
    'Ink and watercolour drawing of {motif}. The whole disc is bright and airy: {fond}. Over it, {fil}, weightless, drifting {mouvement}. '
    'Joyful, light, alive, silent. Abstract, never literal. Everything is held inside one large round watercolour disc, centred in the image '
    'and filling most of it, with a soft irregular edge, on pure white paper. Flat, no sphere, no 3D. Neutral grey only, the paper itself is '
    'the light. Matte, fine dry grain. No text, no frame, no figures, no faces, no hair, no fur, no feathers, no animals, no buildings, '
    'no trees, no dark rim, no heavy black mass.'
)
fonds = {
    'aube': 'a pale wet wash, lightest at the centre, a little more pigment gathered near the soft edge',
    'souffle': 'transparent veils of pale grey crossing the disc like wind, the paper glowing through them',
    'eau': 'a wet-in-wet pale wash with natural granulation, like ink diluted in clear water, no dark mass anywhere',
    'poussiere': 'a pale wash scattered with a fine dust of tiny specks of pigment, light everywhere',
    'reserve': 'bare glowing paper with only a few pale clouds of wash near the edge',
    'courant': 'one pale current of diluted ink flowing across the disc, the rest almost bare paper',
    'givre': 'a pale wash with faint crystalline granulation, bright and cool',
    'bruine': 'a fine pale rain of diluted ink falling softly across the bright disc',
}
mouvements = {'haut': 'upward', 'cote': 'sideways in a gust', 'rond': 'in a slow spiral', 'bas': 'down like slow snow', 'ouvert': 'outward from the centre', 'calme': 'barely, almost still'}
F = ['soie', 'fumee', 'sec', 'brume', 'tremble', 'branche', 'boucle', 'eau', 'flottant', 'botte', 'fouet', 'chanvre', 'pendu', 'rayon', 'une', 'flamme', 'etoile', 'reserve']
D = list(fonds)
M = list(mouvements)
# cinq familles tirées de GRIS (poussière et constellations, l'encre dans l'eau, le vent rouge, le monde qui se défait, ce qui s'ouvre)
FAMILLES = {
    'Poussière de lumière': [
        ('Les étoiles reliées', 'a scatter of tiny bright points joined by thin lines into a loose constellation'),
        ('La poussière soulevée', 'a swarm of tiny specks of light lifted by a gust and turning together'),
        ('La traînée', 'one long trail of fine lines and specks crossing the disc like a comet without a head'),
        ('Le nuage de points', 'a soft cloud of countless tiny dots, denser at one side, thinning into bare paper'),
        ('La pluie d’étoiles', 'fine slanted lines falling with small bright points at their ends'),
        ('Le semis', 'specks of pigment sown in slow curves, like seeds thrown by a hand'),
        ('Les cendres claires', 'pale flakes of ash rising in a thin column of fine lines'),
        ('Le ciel ouvert', 'a wide empty field of paper with a few far specks and one thin arc of lines'),
        ('Les lucioles', 'small points of light trailing short curved lines, scattered without order'),
        ('La voie', 'a dense band of tiny specks crossing the disc diagonally, fading at both ends'),
        ('Le vol de poussière', 'specks and short lines streaming in one direction, bending at the edge'),
        ('La constellation ouverte', 'five or six bright points far apart, joined by hesitant thin lines'),
        ('Le scintillement', 'tiny crosses of four short lines scattered over the pale wash'),
        ('La brume de points', 'a fine mist of dots so small they read as grey, with clear gaps of paper'),
        ('La dispersion', 'a tight cluster of specks at one point exploding gently into the empty disc'),
        ('Les grains du soir', 'coarse granulation of pigment settling at the bottom, light above'),
        ('Le tourbillon de poussière', 'specks and fine lines turning in a loose spiral around an empty centre'),
        ('L’écume', 'a froth of tiny pale bubbles of reserve inside a soft grey veil'),
        ('La neige d’encre', 'small flakes of diluted ink drifting down, each one a tiny soft dot'),
        ('Le dernier point', 'bare paper with one single tiny speck and a few thin lines leaning towards it'),
    ],
    'L’encre dans l’eau': [
        ('La plume qui monte', 'one plume of diluted ink rising in clear water, unfolding into fine filaments'),
        ('Les deux courants', 'two pale currents of ink crossing slowly, their filaments intertwining'),
        ('La goutte dissoute', 'a soft cloud of ink dissolving outward into thin threads, no centre left'),
        ('Le voile sous l’eau', 'a translucent veil of ink hanging in water, its lower edge fraying into filaments'),
        ('Le ruban', 'one long ribbon of diluted ink folding on itself as it sinks'),
        ('Les anneaux flottants', 'concentric rings of pale ink floating on water, stretched by a breath'),
        ('Le remous', 'ink lines following a slow whirl of water and curling back on themselves'),
        ('La marée claire', 'a soft tide line of pigment with fine threads drifting away from it'),
        ('Le souffle sous l’eau', 'a column of small pale bubbles rising through thin drifting lines'),
        ('La chevelure d’eau', 'long parallel lines of ink flowing like water, bending at the edge'),
        ('Le lavis qui s’ouvre', 'a pale wash tearing open gently to show bare paper, threads along the tear'),
        ('La vague fine', 'one thin wave of lines rolling across, foam of reserve at its crest'),
        ('L’eau tremblée', 'lines of water trembling in many tiny vibrations, light between them'),
        ('Le fil qui coule', 'one single line of ink drifting down through clear water, turning twice'),
        ('La source', 'fine lines welling up from one point low in the disc and spreading like water'),
        ('Le delta', 'threads of ink branching again and again, each branch thinner, towards the light'),
        ('La nappe', 'a flat sheet of pale ink seen from above, with fine ripples drawn in it'),
        ('Le courant tiède', 'a soft band of warm grey flowing diagonally, filaments combed along it'),
        ('La transparence', 'two overlapping veils of very pale ink, the paper bright where they do not meet'),
        ('La buée', 'a fine mist of ink condensing into tiny threads on an invisible glass'),
    ],
    'Le vent': [
        ('La rafale', 'hundreds of fine lines bent by one gust, all leaning the same way'),
        ('Les rubans de sable', 'long thin ribbons of pigment streaming sideways, lifting at their ends'),
        ('La spirale lente', 'one wide spiral of fine lines turning around an empty centre'),
        ('Les ailes du moulin', 'four long arcs of lines radiating from one point, blurred by motion'),
        ('Le tourbillon ouvert', 'lines turning in a loose whirl with wide gaps of bare paper'),
        ('L’herbe couchée', 'parallel fine lines pressed flat by wind, springing up again at one side'),
        ('Le cerf-volant perdu', 'one long line climbing in a curve with small loops, trailing a thread'),
        ('Le vent qui tourne', 'short strokes changing direction across the disc, like wind on water'),
        ('La bourrasque', 'a knot of dense lines at one side unravelling into the empty disc'),
        ('Le souffle chaud', 'soft wavy lines rising and widening, like heat over sand'),
        ('Les drapeaux', 'a few long strokes snapping and curling in the same wind'),
        ('Le vent dans les fils', 'many thin threads stretched across, each one vibrating a little'),
        ('La dune', 'one soft curve of pigment with fine lines combed over its crest'),
        ('L’envol', 'fine lines leaving the ground together and spreading into the sky'),
        ('Le vent du matin', 'pale veils crossing the disc, a few darker threads carried in them'),
        ('La girouette', 'lines radiating from one point and all bending the same way at their tips'),
        ('Les feuilles de lignes', 'small curved strokes tumbling in the air, each turning differently'),
        ('Le vent en rond', 'short strokes circling the disc near the edge, calm paper at the centre'),
        ('La tempête douce', 'dense crossing lines on one side, dissolving into stillness on the other'),
        ('Le dernier souffle', 'a few lines drifting slowly, the gust already gone'),
    ],
    'Les fragments': [
        ('Les cubes qui flottent', 'small open cubes drawn in thin lines, floating apart, some half dissolved'),
        ('La ville qui se défait', 'thin vertical and horizontal lines of a structure coming apart into drift'),
        ('L’escalier dans le vide', 'a few short horizontal lines stepping upward into bare paper'),
        ('Le cercle brisé', 'one large circle of lines broken into arcs that drift away from each other'),
        ('Les colonnes de lignes', 'tall thin bundles of vertical lines, their tops fraying into air'),
        ('La mosaïque pâle', 'small squares of pale wash, loosely tiled, gaps of paper between them'),
        ('Le pont de fils', 'one arc of parallel lines crossing the disc, strands hanging from it'),
        ('Les statues de poussière', 'tall soft forms of specks standing in a row, crumbling at the top'),
        ('La fenêtre', 'a rectangle of lines with light pouring through it as bare paper'),
        ('Les marches', 'a flight of fine parallel lines rising diagonally and vanishing'),
        ('Le dallage', 'a grid of thin lines broken and tilted, as if seen through water'),
        ('L’arche ouverte', 'one arch of fine lines, the space inside it brighter than everything'),
        ('Les éclats', 'thin triangular shards of lines scattering from one corner'),
        ('La tour fine', 'one narrow tower of stacked lines leaning, dissolving at the top'),
        ('Les pierres légères', 'a few small rounded shapes of pale wash hovering, lines beneath them'),
        ('Le mur qui respire', 'a wall of horizontal lines bulging softly, light through the cracks'),
        ('Le fil de la ville', 'one continuous line drawing a skyline of boxes and then unravelling'),
        ('Les cadres', 'several thin rectangles overlapping, each a little paler than the last'),
        ('La fissure de lumière', 'a soft grey wash split by one bright crack of bare paper, fine lines along it'),
        ('Les ruines claires', 'broken lines of a structure lying low, pale wash and light above'),
    ],
    'Ce qui s’ouvre': [
        ('La voûte claire', 'fans of fine ribs rising from the rim and opening into bright paper above'),
        ('La fleur de lignes', 'a bud of lines opening outward, each petal a bundle of thin strokes'),
        ('L’éventail', 'a fan of fine lines spreading from one point low in the disc'),
        ('Le chant', 'concentric ripples of thin lines widening from one small bright point'),
        ('La couronne de fils', 'a loose ring of filaments floating around an empty bright centre'),
        ('L’aile ouverte', 'one wide arc of fine lines unfolding slowly across the disc'),
        ('Le rayonnement', 'thin lines radiating from a bright centre, fading before the edge'),
        ('La voûte en éventail', 'four fans of ribs meeting at one pale point, seen from directly below, luminous'),
        ('Les plis qui se défont', 'soft folds of pale wash loosening, fine lines combed along them'),
        ('La graine', 'one small dense knot of lines sending out long thin shoots'),
        ('L’ogive de lumière', 'a pointed arch of fine lines, bare paper glowing inside it'),
        ('Le soleil pâle', 'a soft pale disc of reserve with fine filaments streaming out from it'),
        ('La porte', 'two soft masses of pale wash with a bright narrow gap of paper between them'),
        ('La main qui s’ouvre', 'five bundles of fine lines spreading from one point like fingers, abstract'),
        ('Le bourgeon', 'a tight spiral of lines beginning to unwind at its tip'),
        ('La toile cosmique', 'long fine threads joining small knots around large empty spaces'),
        ('La nef claire', 'two rows of fine vertical lines leaning inward to a bright peak'),
        ('L’horizon qui se lève', 'one soft horizontal band of wash with fine lines rising from it'),
        ('La lanterne', 'a small pale glowing shape of reserve with thin lines hanging below it'),
        ('Le retour de la couleur', 'a wash that starts bare and gathers pigment softly, filaments appearing within it'),
    ],
}


def prompt(b):
    return GABARIT.format(motif=b['motif'], fond=fonds[b['fond']], fil=fils[b['fil']], mouvement=mouvements[b['mouvement']])


def main():
    bulles = []
    n = 0
    for fi, (famille, motifs) in enumerate(FAMILLES.items()):
        for mi, (nom, motif) in enumerate(motifs):
            n += 1
            bulles.append(dict(n=n, famille=famille, nom=nom, motif=motif, fil=F[(fi * 7 + mi * 3) % len(F)], fond=D[(fi + mi) % len(D)], mouvement=M[(fi * 2 + mi) % len(M)]))
    assert len(bulles) == 100 and len({b['motif'] for b in bulles}) == 100
    out = dict(note=__doc__.strip(), gabarit=GABARIT, fils=fils, fonds=fonds, mouvements=mouvements, bulles=bulles, prompts={b['n']: prompt(b) for b in bulles})
    (RACINE / 'design' / 'planche-5-lumiere.json').write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(len(bulles), 'bulles ; prompt le plus long :', max(len(prompt(b)) for b in bulles), 'signes')
    print(prompt(bulles[0]))


if __name__ == '__main__':
    main()
