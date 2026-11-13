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
  { value: 'dia ok/atraso', label: 'Dia OK / Atraso', desc: 'Presença com atraso em minutos' },
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
      let status: StatusType = 'dia ok';
      let atraso = 0;

      if (fdsFolgas.indexOf(d) !== -1) {
        status = 'folga';
        atraso = 0;
      } else if (opIdx === 0 && d === 3) {
        // Liliane dia 3: atraso de 35 min
        status = 'dia ok/atraso';
        atraso = 35;
      } else if (opIdx === 0 && d === 12) {
        // Liliane dia 12: falta
        status = 'falta';
        atraso = 0;
      } else if (opIdx === 5 && d === 15) {
        // Ana Karoline: atestado
        status = 'atestado';
        atraso = 0;
      } else if (opIdx === 15 && d === 8) {
        // Júlia Maria: atraso de 45 min
        status = 'dia ok/atraso';
        atraso = 45;
      } else if (opIdx === 15 && d === 22) {
        // Júlia Maria: falta
        status = 'falta';
        atraso = 0;
      } else if (opIdx === 30 && d === 5) {
        // Mariana Teodósio: atraso de 20 min
        status = 'dia ok/atraso';
        atraso = 20;
      } else if (opIdx === 34 && d === 18) {
        // Daiana Lima: falta
        status = 'falta';
        atraso = 0;
      }

      dias.push({
        dia: d,
        status,
        atraso
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
