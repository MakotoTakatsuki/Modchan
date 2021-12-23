'use strict';

const fortunes = ['Vais adquirir sexo consensual', 'ｷﾀ━━━━━━(ﾟ∀ﾟ)━━━━━━ !!!!', 'Vais encontrar uma choconoiva', '（　´_ゝ`）ﾌｰﾝ', 'ヾ(⌐■_■)ノ♪',
 'Má sorte', 'Boa sorte', 'Tenta outra vez', 'Mais ou menos', 'Vais conhecer um angolano', 'Vais encontrar o verdadeiro amor em Moçambique',
 'Vais conhecer uma queixuda', 'Abençoado pelo Touro de Goa', 'Não vais ter nada e vais gostar', 'Vais comer os insetos', 'Verdadeiro', 'Falso',
 'O teu preservativo vai romper', 'Vais ser trocado por um angolano', 'Vais ser assaltado por um serrano do ultramar com um cajado',
 'Vais encontrar a Marta da tua vida', 'Tens Covid', 'Amanhã o teu dispositivo vai pifar', 'Um urbanita visitará a tua aldeia', '38°47 24.9 N 9°06 34.9 W',
 'Ela tem um pénis feminino uwu', 'Vou te explicar a razão dos meus erros ortográficos e isto é facto e n arrogância mas chama-lhe o quiseres, tenho um QI bastante acima da média e confesso estou sobre um efeito de um estimulante que ainda aumenta a velocidade do raciocinio. Escrevo depressa mas penso ainda mais depressa. Logo cometo falácias de escrita. Não por falta de inteligência ou incapacidade mental. Precisamente o contrário a velocidade a que escrevo é minima comparado á velocidade que penso. Aqui quem têm falta de capacidade és tu caso n compreendas isto depois de uma explicação detalhada',
 'Volta', 'INÊEEEEEEEEESSSSS', 'Vais beber água com o Ronaldo', 'As autoridades foram informadas, um agente encontra-se a caminho da sua residência',
 'Quero me mudar para Portugal, quero ser cidadão europeu', 'Por 600 kwanzas', 'A ABIN agradece a sua contribuição', 'O seu verdadeiro amor estará na Bahia',
 'Perdeu, playboy', 'R$ 1.000.000,00', 'Você dançará pé-diskomandado hoje à noite', 'Vá de retro coisa ruim!', 'Você vai sonhar com Paulo Kogos',
 'Asa de urubu, pena de galinha, se for duplo, o OP vai virar uma mocinha.', 'Ora pois', 'Vai comer o bacalhau e vai gostar safado', 'Quero mudar-me para o Brasil, quero levar um tiro',
 'É ptchan, tudo com letras pequenas, obrigado', 'Que bonito, é um clube privado ou algo assim?', 'Foram depositados 0,20 Costões na sua conta',
 'O gozo que me dá refutar as vossas alegações superficiais e não fundamentadas. Admito canto muito mal mas gosto de cantar pouco me incomoda que seja desafinada. Incomodou-te ? Não forte forçado a ouvir. Liberdade de expressão existe e desafinada ou n eu gosto de a expressar a cantar. Afinada j fui um dia e nem tu sonhas o quanto. Criativa ? O qué que tu fazes da vida ? Porque eu sos 17 anos tinha um livro escrito, tás a criticar a minha escrita ? Até podia ter 8 anos porque começei a escrever poesia aos 5. A minha escrita n é qualquer um que a entende, como n entendes, não te toca, n sentes, criticas o que está escrito mas na realidade n tens a capacidade de a apreciar',
 'Assim como uma criança n aprecia caviar, apesar de ser um bem valioso. Não têm noção da preciosidad, do valor, da raridade, porque naturalmente é criança e n tem embutido em si estes conceitos. Tu lês ? Com que frequência? Nomeadamente poesia ? Não é qualquer um que aprecia poesia ou leitura mas invaludar o escritor porque n sabes apreciar mostra a falta de cultura que têns',
 'Vais encontrar o verdadeiro amor nar segunda dimensão', 'Toma os comprimidos', 'Os desenhos japoneses e as suas consequências foram um desastre para a humanidade',
 'Vais desenvoler esquizofrenia', 'Mais medicação, menos teorias da conspiração', 'Comerás sopa de macaco e serás feliz', 'Os teus dados vão ser entregues à Rússia',
 'As esporrinhas vão ser o teu fim'];
//são 56 no total 1 oct
module.exports = {

	regex: /##sorte/mi,

	markdown: () => {
		const randomFortune = fortunes[Math.floor(Math.random()*fortunes.length)];
		return `<span class='sorte'>Sorte: ${randomFortune}</span>`;
	},

}
