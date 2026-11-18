import { Operator, OperatorMonthlyData, DayRecord, StatusType, Operation } from '../types/abs';

export const INITIAL_OPERATIONS: Operation[] = [
  {
    id: 'caern',
    nome: 'Operação CAERN',
    cliente: 'CAERN (Companhia de Águas e Esgotos do RN)',
    logoUrl: '/assets/aistudio/image_d97c0630.png',
    metaAbs: 0.03, // 3.00%
    jornadaPadraoMin: 370,
    descricao: 'Central Integrada de Atendimento ao Cidadão - Suporte Operacional e Emergências',
    supervisores: [
      'THAYS DA SILVA CUNHA',
      'JOSÉ WAGNER DA SILVA ALVES',
      "MATHEUS D' ALMEIDA MARTINS"
    ]
  },
  {
    id: 'rede-nascer',
    nome: 'Operação Rede Nascer',
    cliente: 'Rede Nascer em Goiás',
    logoUrl: '/assets/aistudio/image_d824c8b7.png',
    metaAbs: 0.03,
    jornadaPadraoMin: 370,
    descricao: 'Atendimento e acolhimento integrado — Rede Nascer em Goiás',
    supervisores: [
      'THALITA PEREIRA VIEIRA',
      'MILLENNYA VICTORIA FLOR DA SILVA',
      'THAMIRES RODRIGUES FERRO'
    ]
  },
  {
    id: 'caema',
    nome: 'Operação CAEMA',
    cliente: 'CAEMA (Companhia de Saneamento Ambiental do Maranhão)',
    logoUrl: '/assets/aistudio/image_418e7775.png',
    metaAbs: 0.03,
    jornadaPadraoMin: 370,
    descricao: 'Central de Atendimento ao Cliente e Suporte Operacional — Maranhão',
    supervisores: [
      'YASMIN ADRIANE SANTOS LEITE',
      'MIKAELA STEFANY DA SILVA VICENTE',
      'RENATHA DA COSTA LOPES'
    ]
  },
  {
    id: 'cagepa',
    nome: 'Operação CAGEPA',
    cliente: 'CAGEPA (Companhia de Água e Esgotos da Paraíba)',
    logoUrl: '/assets/aistudio/image_e94b598a.png',
    metaAbs: 0.03,
    jornadaPadraoMin: 370,
    descricao: 'Central de Atendimento ao Cidadão e Serviços Operacionais — Paraíba',
    supervisores: []
  },
  {
    id: 'sebrae',
    nome: 'Operação SEBRAE',
    cliente: 'SEBRAE (Serviço de Apoio às Micro e Pequenas Empresas)',
    logoUrl: '/assets/aistudio/image_a4fc1e66.png',
    metaAbs: 0.03,
    jornadaPadraoMin: 370,
    descricao: 'Central de Relacionamento e Suporte ao Empreendedor',
    supervisores: []
  }
];

export const INITIAL_OPERATORS_RAW = [
  ['LILIANE RODRIGUES DE OLIVEIRA', 'THAYS DA SILVA CUNHA', '00:00:00', '06:20:00'],
  ['LUANA SILVA DO NASCIMENTO', 'THAYS DA SILVA CUNHA', '00:00:00', '06:20:00'],
  ['AMANDA KELLY LACERDA', 'THAYS DA SILVA CUNHA', '06:00:00', '12:20:00'],
  ['CRISTIANE SILVA DE MELO', 'THAYS DA SILVA CUNHA', '06:00:00', '12:20:00'],
  ['DANIELLA DE SOUZA FELIX SILVESTRE', 'THAYS DA SILVA CUNHA', '06:00:00', '12:20:00'],
  ['ANA KAROLINE DA SILVA SANTOS', 'THAYS DA SILVA CUNHA', '07:00:00', '13:20:00'],
  ['ANA KLECIA MARTINS DE ARAUJO', 'THAYS DA SILVA CUNHA', '07:00:00', '13:20:00'],
  ['GABRIEL SANTOS DA CRUZ NÓBREGA', 'THAYS DA SILVA CUNHA', '07:00:00', '13:20:00'],
  ["AMANDA SANT' ANNA", 'THAYS DA SILVA CUNHA', '08:00:00', '14:20:00'],
  ['LAYDY DAYANE NASCIMENTO DA SILVA', 'THAYS DA SILVA CUNHA', '08:00:00', '14:20:00'],
  ['MICHELI SANTANA DE FREITAS SILVA', 'THAYS DA SILVA CUNHA', '08:00:00', '14:20:00'],
  ['VANESSA PRISCILA CAMPOS SILVA', 'THAYS DA SILVA CUNHA', '08:00:00', '14:20:00'],
  ['MARIA SARA CABRAL DA SILVEIRA', 'THAYS DA SILVA CUNHA', '08:30:00', '14:50:00'],
  ['MARIA CAROLINA GOMES FELIX', 'THAYS DA SILVA CUNHA', '08:30:00', '14:50:00'],
  ['KÁTIA CEANE GOMES DOS SANTOS', 'THAYS DA SILVA CUNHA', '08:30:00', '14:50:00'],
  ['JÚLIA MARIA SOUSA GOMES', 'JOSÉ WAGNER DA SILVA ALVES', '09:00:00', '15:20:00'],
  ['LAIS CAMILA CANUTO PATRICIO DE ABREU', 'JOSÉ WAGNER DA SILVA ALVES', '09:00:00', '15:20:00'],
  ['LAUDENICE NASCIMENTO DA SILVA VIEIRA', 'JOSÉ WAGNER DA SILVA ALVES', '09:00:00', '15:20:00'],
  ['MARIA LETÍCIA DA SILVA ELIAS', 'JOSÉ WAGNER DA SILVA ALVES', '09:00:00', '15:20:00'],
  ['STEFANIE HERCULANO DA SILVA', 'JOSÉ WAGNER DA SILVA ALVES', '09:00:00', '15:20:00'],
  ['WILMARA FERREIRA DA SILVA', 'JOSÉ WAGNER DA SILVA ALVES', '09:00:00', '15:20:00'],
  ['WILLIANE TAWANY SOUZA CAVALCANTI', 'JOSÉ WAGNER DA SILVA ALVES', '09:00:00', '15:20:00'],
  ['WISLANNY MARIA', 'JOSÉ WAGNER DA SILVA ALVES', '09:00:00', '15:20:00'],
  ['GISELE LIANY CRUZ DA SILVA', 'JOSÉ WAGNER DA SILVA ALVES', '09:00:00', '15:20:00'],
  ['THAÍS SOARES REIS CARVALHO', 'JOSÉ WAGNER DA SILVA ALVES', '10:00:00', '16:20:00'],
  ['JULIANA ALEXANDRE DA SILVA', 'JOSÉ WAGNER DA SILVA ALVES', '11:00:00', '17:20:00'],
  ['IZABELLA DAYANA DUARTE', 'JOSÉ WAGNER DA SILVA ALVES', '12:00:00', '18:20:00'],
  ['ALANA KETLYN DA SILVA SANTOS', 'JOSÉ WAGNER DA SILVA ALVES', '12:00:00', '18:20:00'],
  ['HYLLARY BIANKA NASCIMENTO FIRMINO', 'JOSÉ WAGNER DA SILVA ALVES', '13:00:00', '19:20:00'],
  ['SAMARA VITÓRIA RUFINO DOS SANTOS', 'JOSÉ WAGNER DA SILVA ALVES', '13:00:00', '19:20:00'],
  ['MARIANA TEODÓSIO MAIA MARIANO', "MATHEUS D' ALMEIDA MARTINS", '14:00:00', '20:20:00'],
  ['ISAC PEREIRA TONON', "MATHEUS D' ALMEIDA MARTINS", '14:00:00', '20:20:00'],
  ['PEDRO HENRIQUE SANTOS', "MATHEUS D' ALMEIDA MARTINS", '14:00:00', '20:20:00'],
  ['LIVIA MARIA GONÇALVES BERTI', "MATHEUS D' ALMEIDA MARTINS", '14:00:00', '20:20:00'],
  ['DAIANA LIMA', "MATHEUS D' ALMEIDA MARTINS", '15:00:00', '21:20:00'],
  ['GIAN GABRIEL MUNIZ TAVARES DOS SANTOS', "MATHEUS D' ALMEIDA MARTINS", '15:00:00', '21:20:00'],
  ['ANA VITÓRIA DA SILVA CARVALHO', "MATHEUS D' ALMEIDA MARTINS", '16:00:00', '22:20:00'],
  ['VICTOR SILVA DE SOUZA', "MATHEUS D' ALMEIDA MARTINS", '16:00:00', '22:20:00'],
  ['LUIZ FELIPE SOUZA COSTA', "MATHEUS D' ALMEIDA MARTINS", '16:00:00', '22:20:00'],
  ['LUCIMAR SILVA DO REGO ARAUJO', "MATHEUS D' ALMEIDA MARTINS", '17:00:00', '23:20:00'],
  ['VITORIA LIMA DA SILVA', "MATHEUS D' ALMEIDA MARTINS", '17:00:00', '23:20:00'],
  ['ERIKA KELLA QUEIROZ BALBINO', "MATHEUS D' ALMEIDA MARTINS", '18:00:00', '00:20:00'],
  ['JANDERSON PAULINO DE SOUZA', "MATHEUS D' ALMEIDA MARTINS", '18:00:00', '00:20:00'],
  ['JÉSSICA MARIA DE SOUZA FELIX', "MATHEUS D' ALMEIDA MARTINS", '18:00:00', '00:20:00'],
  ['PEDRO VINICIUS DA SILVA', 'THAYS DA SILVA CUNHA', '00:00:00', '06:20:00'],
  ['ADELAIDE KAROLINE SOARES PEREIRA', 'THAYS DA SILVA CUNHA', '08:00:00', '14:20:00'],
  ['BIANCA LETICIA FELIPE', 'THAYS DA SILVA CUNHA', '08:00:00', '14:20:00'],
  ['IRLEY RAYANNE GOMES DO NASCIMENTO', 'THAYS DA SILVA CUNHA', '08:00:00', '14:20:00'],
  ['MARIA EDUARDA DE LIMA', 'JOSÉ WAGNER DA SILVA ALVES', '09:00:00', '15:20:00'],
  ['VANESSA PRISCILA CAMPOS SILVA', 'JOSÉ WAGNER DA SILVA ALVES', '09:00:00', '15:20:00'],
  ['RAFAELLY ALVES DA SILVA', 'JOSÉ WAGNER DA SILVA ALVES', '10:00:00', '16:20:00'],
  ['BIANCA LETICIA FELIPE', 'JOSÉ WAGNER DA SILVA ALVES', '10:00:00', '16:20:00'],
  ['VICTHORIA PAULA DA SILVA CABRAL', 'JOSÉ WAGNER DA SILVA ALVES', '10:00:00', '16:20:00'],
  ['KAUANNE KARLA M R DA SILVA', 'JOSÉ WAGNER DA SILVA ALVES', '10:00:00', '16:20:00'],
  ['MARIA VITORIA PEREIRA DOS SANTOS', 'JOSÉ WAGNER DA SILVA ALVES', '10:00:00', '16:20:00'],
  ['RHAYSSA LÚCIA LIMA DE VASCONCELOS', 'JOSÉ WAGNER DA SILVA ALVES', '10:00:00', '16:20:00'],
  ['EVELLYN FERREIRA DE ALMEIDA', "MATHEUS D' ALMEIDA MARTINS", '13:00:00', '19:20:00'],
  ['RAFAELA PEREIRA DOS SANTOS', "MATHEUS D' ALMEIDA MARTINS", '13:00:00', '19:20:00'],
  ['TALLYTA SOUZA BATISTA', "MATHEUS D' ALMEIDA MARTINS", '13:00:00', '19:20:00'],
  ['ALESSANDRA MORAIS DE LIMA', "MATHEUS D' ALMEIDA MARTINS", '14:00:00', '20:20:00'],
  ['ANA CLARA PEREIRA LOPES ANDRADE', "MATHEUS D' ALMEIDA MARTINS", '14:00:00', '20:20:00']
];

export const CAEMA_SUPERVISORES = [
  'YASMIN ADRIANE SANTOS LEITE',
  'MIKAELA STEFANY DA SILVA VICENTE',
  'RENATHA DA COSTA LOPES'
];

export const INITIAL_CAEMA_OPERATORS_RAW = [
  ['STHEPHANY BARBOSA DOS SANTOS SILVA', 'YASMIN ADRIANE SANTOS LEITE', '00:00:00', '06:20:00'],
  ['VANESSA LUCENA FRANÇA', 'YASMIN ADRIANE SANTOS LEITE', '00:00:00', '06:20:00'],
  ['ALLAN DAYVID ALVES DOS SANTOS', 'YASMIN ADRIANE SANTOS LEITE', '06:00:00', '12:20:00'],
  ['ITAUANY HELOISA DA SILVA GONÇALVES', 'YASMIN ADRIANE SANTOS LEITE', '06:00:00', '12:20:00'],
  ['LUANA YONARA DA CONCEIÇÃO LUCENA', 'YASMIN ADRIANE SANTOS LEITE', '06:00:00', '12:20:00'],
  ['BIANCA DE OLIVEIRA BEZERRA', 'YASMIN ADRIANE SANTOS LEITE', '08:00:00', '14:20:00'],
  ['CELINE LAYLLA ARAÚJO LIMA', 'YASMIN ADRIANE SANTOS LEITE', '08:00:00', '14:20:00'],
  ['HEMILLY BEATRIZ SANTOS DE OLIVEIRA', 'YASMIN ADRIANE SANTOS LEITE', '09:00:00', '15:20:00'],
  ['DEYANE PONTES DE SOUZA', 'MIKAELA STEFANY DA SILVA VICENTE', '10:00:00', '16:20:00'],
  ['ELIZAMA FELIX DOS SANTOS', 'MIKAELA STEFANY DA SILVA VICENTE', '10:00:00', '16:20:00'],
  ['KEILA JAÍRA DA SILVA VIEIRA', 'MIKAELA STEFANY DA SILVA VICENTE', '10:00:00', '16:20:00'],
  ['DEYSY DANNYELE', 'MIKAELA STEFANY DA SILVA VICENTE', '11:00:00', '17:20:00'],
  ['MARIA CLARA DOS SANTOS', 'MIKAELA STEFANY DA SILVA VICENTE', '12:00:00', '18:20:00'],
  ['TÁTILLA INÁCIO TRINDADE', 'MIKAELA STEFANY DA SILVA VICENTE', '12:00:00', '18:20:00'],
  ['ALLANNA GABRIELE DOS SANTOS PEREIRA', 'MIKAELA STEFANY DA SILVA VICENTE', '13:00:00', '19:20:00'],
  ['FLAVIA DA SILVA BENICIO', 'RENATHA DA COSTA LOPES', '14:00:00', '20:20:00'],
  ['MARIA DO SOCORRO MACHADO DE ARAÚJO', 'RENATHA DA COSTA LOPES', '14:00:00', '20:20:00'],
  ['ESTEFANY LUIZE DA SILVA', 'RENATHA DA COSTA LOPES', '15:00:00', '21:20:00'],
  ['FRANCIELLE PEREIRA DE LIRA', 'RENATHA DA COSTA LOPES', '15:00:00', '21:20:00'],
  ['JENIFFER DA SILVA FEITOZA', 'RENATHA DA COSTA LOPES', '15:00:00', '21:20:00'],
  ['KARLA CRISTINA DA SILVA CAVALCANTI', 'RENATHA DA COSTA LOPES', '17:00:00', '23:20:00'],
  ['DAVI MANOEL MARINHO DA SILVA', 'RENATHA DA COSTA LOPES', '18:00:00', '00:20:00'],
  ['GEISI MILLA NASCIMENTO DOS SANTOS', 'RENATHA DA COSTA LOPES', '18:00:00', '00:20:00'],
  ['WANESSA MATIAS RIBEIRO', 'YASMIN ADRIANE SANTOS LEITE', '06:00:00', '12:20:00'],
  ['MARIA EDUARDA FERNANDES COSTA', 'YASMIN ADRIANE SANTOS LEITE', '07:00:00', '13:20:00'],
  ['HALLYNE MATIAS DE OLIVEIRA', 'YASMIN ADRIANE SANTOS LEITE', '08:00:00', '14:20:00'],
  ['MARIA CAROLINE SOBRAL CHAGAS', 'YASMIN ADRIANE SANTOS LEITE', '08:00:00', '14:20:00'],
  ['HADJA GOMES PEREIRA', 'MIKAELA STEFANY DA SILVA VICENTE', '10:00:00', '16:20:00'],
  ['ELEN KÁTIA DE SOUSA LIMA', 'MIKAELA STEFANY DA SILVA VICENTE', '10:00:00', '16:20:00'],
  ['MAYANNA EUGÊNIA FREIRE COUTINHO', 'MIKAELA STEFANY DA SILVA VICENTE', '13:00:00', '19:20:00'],
  ['RAYSSA VITÓRIA ROCHA MENDES', 'MIKAELA STEFANY DA SILVA VICENTE', '13:00:00', '19:20:00'],
  ['YUMMI AVELINO BATISTA FIDELES', 'MIKAELA STEFANY DA SILVA VICENTE', '13:00:00', '19:20:00'],
  ['ALICE PEREIRA DUARTE', 'MIKAELA STEFANY DA SILVA VICENTE', '13:00:00', '19:20:00'],
  ['YASMIM BIANCA SILVA DO NASCIMENTO', 'RENATHA DA COSTA LOPES', '14:00:00', '20:20:00'],
  ['ADRENYS SILVA DAS NEVES', 'RENATHA DA COSTA LOPES', '14:00:00', '20:20:00'],
  ['ISABELA VELOZO DA SILVA REIS', 'RENATHA DA COSTA LOPES', '14:00:00', '20:20:00'],
  ['ANDRÉ ROCHA FERNANDES DANTAS', 'RENATHA DA COSTA LOPES', '18:00:00', '00:20:00']
];

function calcShiftMinutes(entrada: string, saida: string): number {
  const [eh, em] = entrada.split(':').map(Number);
  const [sh, sm] = saida.split(':').map(Number);
  if (Number.isNaN(eh) || Number.isNaN(sh)) return 370;
  const start = eh * 60 + (em || 0);
  const end = sh * 60 + (sm || 0);
  const diff = end >= start ? end - start : 1440 - start + end;
  if (diff <= 0) return 370;
  return diff === 380 ? 370 : diff;
}

export const INITIAL_CAEMA_OPERATORS: Operator[] = INITIAL_CAEMA_OPERATORS_RAW.map((row, idx) => ({
  id: `caema-op-${idx + 1}`,
  nome: row[0],
  supervisor: row[1],
  entrada: row[2],
  saida: row[3],
  jornadaMin: calcShiftMinutes(row[2], row[3]),
  offDayOfWeek: (idx % 6) + 1,
  operacaoId: 'caema',
}));

export const REDE_NASCER_SUPERVISORES = [
  'THALITA PEREIRA VIEIRA',
  'MILLENNYA VICTORIA FLOR DA SILVA',
  'THAMIRES RODRIGUES FERRO'
];

export const INITIAL_REDE_NASCER_OPERATORS_RAW = [
  ['ALINE COSTA DOS SANTOS', 'THALITA PEREIRA VIEIRA', '00:00:00', '06:20:00'],
  ['JOSILEIDE DA COSTA PEREIRA', 'THALITA PEREIRA VIEIRA', '00:00:00', '06:20:00'],
  ['MARIA KAROLINA MENDES DE ARAÚJO', 'THALITA PEREIRA VIEIRA', '06:00:00', '12:20:00'],
  ['MILIANE MATIAS DE BRITO', 'THALITA PEREIRA VIEIRA', '06:00:00', '12:20:00'],
  ['SAMARA LEITE MODESTO', 'THALITA PEREIRA VIEIRA', '06:00:00', '12:20:00'],
  ['VITORIA MARQUES DE OLIVEIRA SILVA', 'THALITA PEREIRA VIEIRA', '06:00:00', '12:20:00'],
  ['ANA PATRÍCIA DA SILVA LUSTOSA', 'THALITA PEREIRA VIEIRA', '06:00:00', '12:20:00'],
  ['ANA PAULA LIRA GUIMARÃES', 'THALITA PEREIRA VIEIRA', '07:00:00', '13:20:00'],
  ['VERA LÚCIA DE SOUSA SANTOS', 'THALITA PEREIRA VIEIRA', '07:00:00', '13:20:00'],
  ['WILIANA EMIDIO BEZERRA GOUVEA', 'THALITA PEREIRA VIEIRA', '07:00:00', '13:20:00'],
  ['LIANE MÁGDA FAGUNDES DE SOUZA SERRANO', 'THALITA PEREIRA VIEIRA', '07:00:00', '13:20:00'],
  ['ESTER LAIS LEITE DANIEL', 'THALITA PEREIRA VIEIRA', '08:00:00', '14:20:00'],
  ['JAMILLY CRIZ CONSTÂNCIO DOS REIS', 'THALITA PEREIRA VIEIRA', '08:00:00', '14:20:00'],
  ['ADRIANA HOLANDA', 'THALITA PEREIRA VIEIRA', '08:00:00', '14:20:00'],
  ['ERIVÂNIA PEREIRA DA SILVA', 'THALITA PEREIRA VIEIRA', '08:00:00', '14:20:00'],
  ['ELIANNY CAVALCANTI BARROS DOS SANTOS', 'THALITA PEREIRA VIEIRA', '08:00:00', '14:20:00'],
  ['EVODIA GUILHERME SIMAO DA SILVA', 'THALITA PEREIRA VIEIRA', '08:00:00', '14:20:00'],
  ['MÁRCIA LÉDJA SANTOS C SOARES', 'MILLENNYA VICTORIA FLOR DA SILVA', '08:00:00', '14:20:00'],
  ['MARIA BIANCA CORREIA DOMINGUES', 'MILLENNYA VICTORIA FLOR DA SILVA', '08:00:00', '14:20:00'],
  ['THAÍS CORREIA SILVA RIBEIRO', 'MILLENNYA VICTORIA FLOR DA SILVA', '08:00:00', '14:20:00'],
  ['STEPHANY MARIA SOUSA DA CRUZ', 'MILLENNYA VICTORIA FLOR DA SILVA', '08:00:00', '15:20:00'],
  ['WALÉRIA MARIA BD REBOUÇAS', 'MILLENNYA VICTORIA FLOR DA SILVA', '08:00:00', '14:20:00'],
  ['ANDREZA IRIS DE SOUZA BARBOSA', 'MILLENNYA VICTORIA FLOR DA SILVA', '09:00:00', '15:20:00'],
  ['DEYSIELE MAYSE GOMES DASILVA', 'MILLENNYA VICTORIA FLOR DA SILVA', '09:00:00', '15:20:00'],
  ['BIANKA CAROLINE DOS SANTOS SOUZA', 'MILLENNYA VICTORIA FLOR DA SILVA', '09:00:00', '15:20:00'],
  ['MARIA DO SOCORRO SIQUEIRA FERREIRA', 'MILLENNYA VICTORIA FLOR DA SILVA', '09:00:00', '15:20:00'],
  ['MARIANA CONCEIÇÃO SILVA DE ALMEIDA', 'MILLENNYA VICTORIA FLOR DA SILVA', '09:00:00', '15:20:00'],
  ['STERPHANIE DOS SANTOS TRIGUEIRO DA ROCHA', 'MILLENNYA VICTORIA FLOR DA SILVA', '09:00:00', '15:20:00'],
  ['ADNA HELOYSA VENTURA RODRIGUES', 'MILLENNYA VICTORIA FLOR DA SILVA', '10:00:00', '16:20:00'],
  ['ROSEANY LAURENTINO DA ROCHA', 'MILLENNYA VICTORIA FLOR DA SILVA', '10:00:00', '16:20:00'],
  ['GEOVÂNIA MARIA CAMBOIM DE SOUZA', 'MILLENNYA VICTORIA FLOR DA SILVA', '11:00:00', '17:20:00'],
  ['KARLA TACIANA BASTOS CRISÓSTOMO', 'MILLENNYA VICTORIA FLOR DA SILVA', '11:00:00', '17:20:00'],
  ['GABRIELA MOREIRA DE LIMA', 'MILLENNYA VICTORIA FLOR DA SILVA', '12:00:00', '19:20:00'],
  ['MARIANA FALCÃO DE LIMA', 'MILLENNYA VICTORIA FLOR DA SILVA', '12:00:00', '18:20:00'],
  ['JANAYNA PAIVA DA SILVA', 'MILLENNYA VICTORIA FLOR DA SILVA', '13:00:00', '19:20:00'],
  ['YASMIM MEDEIROS DE LUCENA', 'THAMIRES RODRIGUES FERRO', '13:00:00', '19:20:00'],
  ['ADRIA VALENTIM DE CASTRO BARRETO', 'THAMIRES RODRIGUES FERRO', '13:00:00', '19:20:00'],
  ['ADRIELLE PONTES FERNANDES DA CRUZ', 'THAMIRES RODRIGUES FERRO', '13:00:00', '19:20:00'],
  ['ANNA FLÁVIA BARBOSA FERREIRA', 'THAMIRES RODRIGUES FERRO', '13:00:00', '19:20:00'],
  ['JANINE DA SILVA SALES', 'THAMIRES RODRIGUES FERRO', '13:00:00', '19:20:00'],
  ['SILVIA CLECIA FERREIRA LINS', 'THAMIRES RODRIGUES FERRO', '13:00:00', '19:20:00'],
  ['SOLANGE DE BRITO PATRÍCIO', 'THAMIRES RODRIGUES FERRO', '13:00:00', '19:20:00'],
  ['ELIANE PEREIRA DA SILVA', 'THAMIRES RODRIGUES FERRO', '14:00:00', '20:20:00'],
  ['EMILLY CANDIDA DUARTE PEREIRA', 'THAMIRES RODRIGUES FERRO', '14:00:00', '20:20:00'],
  ['ERICA SILVA DAS NEVES', 'THAMIRES RODRIGUES FERRO', '14:00:00', '20:20:00'],
  ['ROSINEIDE GALDINO DE LIMA', 'THAMIRES RODRIGUES FERRO', '14:00:00', '20:20:00'],
  ['EVA GOMES NASCIMENTO', 'THAMIRES RODRIGUES FERRO', '15:00:00', '21:20:00'],
  ['GISLAYNNE DA COSTA LIMA SILVA', 'THAMIRES RODRIGUES FERRO', '15:00:00', '21:20:00'],
  ['RAYSSA MARIA SOUZA DA SILVA', 'THAMIRES RODRIGUES FERRO', '15:00:00', '21:20:00'],
  ['MARTA DOS SANTOS COSTA', 'THAMIRES RODRIGUES FERRO', '16:00:00', '22:20:00'],
  ['VITÓRIA BRUNA ARAÚJO DE SOUSA', 'THAMIRES RODRIGUES FERRO', '18:00:00', '00:20:00'],
  ['SARAH LIVIA FERREIRA ARAÚJO', 'THAMIRES RODRIGUES FERRO', '18:00:00', '00:20:00']
];

export const INITIAL_REDE_NASCER_OPERATORS: Operator[] = INITIAL_REDE_NASCER_OPERATORS_RAW.map((row, idx) => ({
  id: `rn-op-${idx + 1}`,
  nome: row[0],
  supervisor: row[1],
  entrada: row[2],
  saida: row[3],
  jornadaMin: calcShiftMinutes(row[2], row[3]),
  offDayOfWeek: (idx % 6) + 1,
  operacaoId: 'rede-nascer',
}));

export const INITIAL_CAERN_OPERATORS: Operator[] = INITIAL_OPERATORS_RAW.map((row, idx) => ({
  id: `op-${idx + 1}`,
  nome: row[0],
  supervisor: row[1],
  entrada: row[2],
  saida: row[3],
  jornadaMin: calcShiftMinutes(row[2], row[3]),
  offDayOfWeek: (idx % 6) + 1, // Folga semanal escalonada no regime 6x1
  operacaoId: 'caern',
}));

export const INITIAL_CAERN_BATCH2_OPERATORS: Operator[] = INITIAL_CAERN_OPERATORS.slice(44);

export const INITIAL_OPERATORS: Operator[] = [
  ...INITIAL_CAERN_OPERATORS,
  ...INITIAL_CAEMA_OPERATORS,
  ...INITIAL_REDE_NASCER_OPERATORS
];

export const SUPERVISORES_LIST = [
  'THAYS DA SILVA CUNHA',
  'JOSÉ WAGNER DA SILVA ALVES',
  "MATHEUS D' ALMEIDA MARTINS"
];

export const STATUS_OPTIONS: { value: StatusType; label: string; desc: string }[] = [
  { value: 'dia ok', label: 'Dia OK', desc: 'Presença integral (370 min escalados, 0 perdidos)' },
  { value: 'dia ok/atraso', label: 'Dia OK / Atraso', desc: 'Presença com atraso em minutos (gera ABS)' },
  {
    value: 'abono',
    label: 'Abono (Horas Faltantes)',
    desc: 'Declaração médica/universidade — horas faltantes justificadas geram ABS'
  },
  {
    value: 'abono_legal',
    label: 'Abono Legal (Saída Prog. BH)',
    desc: 'Saída antecipada programada com Banco de Horas (não gera ABS)'
  },
  {
    value: 'banco_horas_integral',
    label: 'Banco de Horas Integral',
    desc: 'Ausência integral compensada com Banco de Horas (não gera ABS)'
  },
  {
    value: 'folga_aniversario',
    label: 'Folga Aniversário',
    desc: 'Folga comemorativa de aniversário (não gera ABS)'
  },
  {
    value: 'afastamento',
    label: 'Afastamento',
    desc: 'Afastamento médico/licença (não gera ABS)'
  },
  { value: 'atestado', label: 'Atestado Médico', desc: 'Ausência justificada (370 min perdidos)' },
  { value: 'falta', label: 'Falta Injustificada', desc: 'Ausência não justificada (370 min perdidos)' },
  { value: 'folga', label: 'Folga Escalar (DSR)', desc: 'Descanso remunerado (não entra no cálculo)' },
  { value: 'suspensão', label: 'Suspensão Disciplinar', desc: 'Penalidade disciplinar (370 min perdidos)' }
];

export function generateInitialMonthlyData(operators: Operator[]): Record<string, OperatorMonthlyData> {
  const data: Record<string, OperatorMonthlyData> = {};

  operators.forEach((op, opIdx) => {
    const dias: DayRecord[] = [];
    
    // Escala 6x1 com 4 folgas flexíveis em finais de semana
    // Metade folga nos 4 domingos [7, 14, 21, 28], outra metade nos 4 sábados [6, 13, 20, 27]
    const fdsFolgas = (opIdx % 2 === 0) ? [7, 14, 21, 28] : [6, 13, 20, 27];

    for (let d = 1; d <= 31; d++) {
      const status: StatusType = fdsFolgas.indexOf(d) !== -1 ? 'folga' : 'dia ok';

      dias.push({
        dia: d,
        status,
        atraso: 0
      });
    }

    data[op.id] = {
      operatorId: op.id,
      dias
    };
  });

  return data;
}

export const WEEKDAYS_ABBR = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
