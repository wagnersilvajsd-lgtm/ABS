import { Operator, OperatorMonthlyData, DayRecord, StatusType, Operation } from '../types/abs';

export const INITIAL_OPERATIONS: Operation[] = [
  {
    id: 'caern',
    nome: 'Operação CAERN',
    cliente: 'CAERN (Companhia de Águas e Esgotos do RN)',
    logoUrl: '/assets/aistudio/image_d97c0630.png',
    metaAbs: 0.03, // 3.00%
    jornadaPadraoMin: 380,
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
    jornadaPadraoMin: 380,
    descricao: 'Atendimento e acolhimento integrado — Rede Nascer em Goiás',
    supervisores: []
  },
  {
    id: 'caema',
    nome: 'Operação CAEMA',
    cliente: 'CAEMA (Companhia de Saneamento Ambiental do Maranhão)',
    logoUrl: '/assets/aistudio/image_418e7775.png',
    metaAbs: 0.03,
    jornadaPadraoMin: 380,
    descricao: 'Central de Atendimento ao Cliente e Suporte Operacional — Maranhão',
    supervisores: []
  },
  {
    id: 'cagepa',
    nome: 'Operação CAGEPA',
    cliente: 'CAGEPA (Companhia de Água e Esgotos da Paraíba)',
    logoUrl: '/assets/aistudio/image_e94b598a.png',
    metaAbs: 0.03,
    jornadaPadraoMin: 380,
    descricao: 'Central de Atendimento ao Cidadão e Serviços Operacionais — Paraíba',
    supervisores: []
  },
  {
    id: 'sebrae',
    nome: 'Operação SEBRAE',
    cliente: 'SEBRAE (Serviço de Apoio às Micro e Pequenas Empresas)',
    logoUrl: '/assets/aistudio/image_a4fc1e66.png',
    metaAbs: 0.03,
    jornadaPadraoMin: 380,
    descricao: 'Central de Relacionamento e Suporte ao Empreendedor',
    supervisores: []
  },
  {
    id: 'ses',
    nome: 'Operação SES',
    cliente: 'SES (Secretaria de Estado de Saúde)',
    logoUrl: '',
    metaAbs: 0.03,
    jornadaPadraoMin: 380,
    descricao: 'Central de Atendimento e Regulação em Saúde — SES',
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
  ['JÉSSICA MARIA DE SOUZA FELIX', "MATHEUS D' ALMEIDA MARTINS", '18:00:00', '00:20:00']
];

export const INITIAL_OPERATORS: Operator[] = INITIAL_OPERATORS_RAW.map((row, idx) => ({
  id: `op-${idx + 1}`,
  nome: row[0],
  supervisor: row[1],
  entrada: row[2],
  saida: row[3],
  jornadaMin: 380, // 6 horas e 20 minutos
  offDayOfWeek: (idx % 6) + 1, // Folga semanal escalonada no regime 6x1
  operacaoId: 'caern',
}));

export const SUPERVISORES_LIST = [
  'THAYS DA SILVA CUNHA',
  'JOSÉ WAGNER DA SILVA ALVES',
  "MATHEUS D' ALMEIDA MARTINS"
];

export const STATUS_OPTIONS: { value: StatusType; label: string; desc: string }[] = [
  { value: 'dia ok', label: 'Dia OK', desc: 'Presença integral (380 min escalados, 0 perdidos)' },
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
  { value: 'atestado', label: 'Atestado Médico', desc: 'Ausência justificada (380 min perdidos)' },
  { value: 'falta', label: 'Falta Injustificada', desc: 'Ausência não justificada (380 min perdidos)' },
  { value: 'folga', label: 'Folga Escalar (DSR)', desc: 'Descanso remunerado (não entra no cálculo)' },
  { value: 'suspensão', label: 'Suspensão Disciplinar', desc: 'Penalidade disciplinar (380 min perdidos)' }
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
