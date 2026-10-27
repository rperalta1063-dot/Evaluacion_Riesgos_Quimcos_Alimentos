
import { ChemicalPreset, DistributionType, DistributionParams } from './types';

export const PREDEFINED_CHEMICALS: Record<string, ChemicalPreset> = {
  // Insecticidas
  'chlorpyrifos': { 
    adi: 0.01, 
    unit: 'mg/kg·día', 
    name: 'Clorpirifos',
    description: 'Insecticida organofosforado de amplio espectro que actúa inhibiendo la acetilcolinesterasa.',
    targetOrgans: 'Sistema Nervioso Central y Periférico.',
    source: 'JECFA (Joint FAO/WHO Expert Committee on Food Additives)'
  },
  'deltamethrin': { 
    adi: 0.01, 
    unit: 'mg/kg·día', 
    name: 'Deltametrina',
    description: 'Insecticida piretroide sintético que actúa por contacto e ingestión sobre el sistema nervioso.',
    targetOrgans: 'Sistema Nervioso.',
    source: 'JECFA / EFSA (European Food Safety Authority)'
  },
  'malathion': { 
    adi: 0.3, 
    unit: 'mg/kg·día', 
    name: 'Malatión',
    description: 'Insecticida organofosforado de baja toxicidad humana comparada con otros de su clase.',
    targetOrgans: 'Sistema Nervioso, Hígado.',
    source: 'JECFA'
  },
  'fipronil': { 
    adi: 0.0002, 
    unit: 'mg/kg·día', 
    name: 'Fipronil',
    adiRange: '0–0.0002 mg/kg de peso corporal (JMPR)',
    description: 'Insecticida de amplio espectro perteneciente a la familia de los fenilpirazoles. La JMPR (FAO/OMS) y la EFSA establecieron una Ingesta Diaria Admisible (IDA / ADI) de 0–0.0002 mg/kg de peso corporal (basada en NOAEL de 0.019 mg/kg pc/día en estudio de 2 años en ratas y factor de seguridad de 100). Dosis de Referencia Aguda (ARfD): 0.003 mg/kg pc.',
    targetOrgans: 'Sistema Nervioso Central (canales de cloruro regulados por GABA), Hígado, Tiroides.',
    source: 'JMPR (Joint FAO/WHO Meeting on Pesticide Residues) / EFSA'
  },
  'imidacloprid': { 
    adi: 0.06, 
    unit: 'mg/kg·día', 
    name: 'Imidacloprid',
    description: 'Insecticida neonicotinoide sistémico que actúa bloqueando los receptores nicotínicos de acetilcolina.',
    targetOrgans: 'Sistema Nervioso, Hígado, Riñones.',
    source: 'EFSA / JMPR (Joint FAO/WHO Meeting on Pesticide Residues)'
  },
  'abamectin': { 
    adi: 0.001, 
    unit: 'mg/kg·día', 
    name: 'Abamectina',
    description: 'Mezcla de avermectinas que actúa estimulando la liberación de GABA, provocando parálisis en plagas.',
    targetOrgans: 'Sistema Nervioso Central (Barrera Hematoencefálica), Hígado.',
    source: 'JECFA / JMPR'
  },
  'cypermethrin': { 
    adi: 0.02, 
    unit: 'mg/kg·día', 
    name: 'Cipermetrina',
    description: 'Piretroide de tipo II que prolonga la apertura de los canales de sodio en las membranas nerviosas.',
    targetOrgans: 'Sistema Nervioso, Hígado, Sistema Inmunológico.',
    source: 'JECFA / JMPR'
  },
  'acetamiprid': { 
    adi: 0.07, 
    unit: 'mg/kg·día', 
    name: 'Acetamiprid',
    description: 'Neonicotinoide sistémico con baja toxicidad aguda para aves y abejas comparado con otros neonicotinoides.',
    targetOrgans: 'Sistema Nervioso, Hígado, Riñones.',
    source: 'EFSA / EPA'
  },
  'thiamethoxam': { 
    adi: 0.08, 
    unit: 'mg/kg·día', 
    name: 'Tiametoxam',
    description: 'Neonicotinoide de segunda generación con excelente actividad sistémica y persistencia en la planta.',
    targetOrgans: 'Hígado (Metabolismo), Sistema Nervioso, Riñones.',
    source: 'EFSA / JMPR'
  },
  'lambda_cyhalothrin': { 
    adi: 0.0025, 
    unit: 'mg/kg·día', 
    name: 'Lambda-cialotrina',
    description: 'Insecticida piretroide de cuarta generación con alta eficacia a bajas dosis.',
    targetOrgans: 'Sistema Nervioso (Canales de Sodio).',
    source: 'JMPR / EFSA'
  },
  'dimethoate': { 
    adi: 0.001, 
    unit: 'mg/kg·día', 
    name: 'Dimetoato (Insecticida)',
    description: 'Organofosforado sistémico que inhibe la enzima colinesterasa, esencial para la función nerviosa.',
    targetOrgans: 'Sistema Nervioso, Hígado, Sistema Reproductivo.',
    source: 'JMPR / EFSA'
  },
  'permethrin': { 
    adi: 0.05, 
    unit: 'mg/kg·día', 
    name: 'Permetrina (Insecticida)',
    description: 'Piretroide sintético estable a la luz, utilizado ampliamente tanto en agricultura como en salud pública.',
    targetOrgans: 'Sistema Nervioso, Hígado, Piel.',
    source: 'JECFA / JMPR'
  },
  'spinosad': { 
    adi: 0.02, 
    unit: 'mg/kg·día', 
    name: 'Spinosad (Insecticida)',
    description: 'Insecticida biológico derivado de la fermentación de la bacteria Saccharopolyspora spinosa.',
    targetOrgans: 'Hígado (vacuolización), Sistema Nervioso.',
    source: 'JMPR / EFSA'
  },
  'methomyl': { 
    adi: 0.025, 
    unit: 'mg/kg·día', 
    name: 'Metomilo (Insecticida)',
    description: 'Carbamato altamente tóxico que inhibe reversiblemente la acetilcolinesterasa.',
    targetOrgans: 'Sistema Nervioso, Sangre (Eritrocitos), Hígado.',
    source: 'JMPR'
  },
  'bifenthrin': {
    adi: 0.015,
    unit: 'mg/kg·día',
    name: 'Bifentrina (Insecticida)',
    description: 'Piretroide de amplio espectro que afecta el sistema nervioso al prolongar la activación de los canales de sodio.',
    targetOrgans: 'Sistema Nervioso, Hígado.',
    source: 'JMPR'
  },
  'carbaryl': {
    adi: 0.01,
    unit: 'mg/kg·día',
    name: 'Carbarilo (Insecticida)',
    description: 'Insecticida de la familia de los carbamatos que actúa como inhibidor reversible de la colinesterasa.',
    targetOrgans: 'Sistema Nervioso, Hígado, Sistema Reproductivo.',
    source: 'JECFA / JMPR'
  },
  'propargite': {
    adi: 0.01,
    unit: 'mg/kg·día',
    name: 'Propargita (Acaricida)',
    description: 'Acaricida utilizado para el control de ácaros en diversos cultivos; actúa por contacto e inhalación.',
    targetOrgans: 'Hígado, Riñones, Sistema Gastrointestinal.',
    source: 'JMPR'
  },
  'endosulfan': {
    adi: 0.006,
    unit: 'mg/kg·día',
    name: 'Endosulfán (Insecticida)',
    description: 'Insecticida organoclorado de amplio espectro, actualmente prohibido en muchos países por su persistencia ambiental.',
    targetOrgans: 'Sistema Nervioso, Hígado, Riñones.',
    source: 'JMPR'
  },
  'carbofuran': {
    adi: 0.001,
    unit: 'mg/kg·día',
    name: 'Carbofurano (Insecticida)',
    description: 'Carbamato sistémico altamente tóxico utilizado para el control de insectos y nemátodos.',
    targetOrgans: 'Sistema Nervioso, Sistema Reproductivo.',
    source: 'JMPR'
  },
  'diazinon': {
    adi: 0.005,
    unit: 'mg/kg·día',
    name: 'Diazinón (Insecticida)',
    description: 'Organofosforado no sistémico utilizado en agricultura y para el control de parásitos externos en animales.',
    targetOrgans: 'Sistema Nervioso (Colinesterasa).',
    source: 'JMPR'
  },
  'buprofezin': {
    adi: 0.009,
    unit: 'mg/kg·día',
    name: 'Buprofezina (Insecticida)',
    description: 'Regulador del crecimiento de insectos que inhibe la síntesis de quitina.',
    targetOrgans: 'Hígado, Tiroides.',
    source: 'EFSA'
  },
  'clothianidin': {
    adi: 0.1,
    unit: 'mg/kg·día',
    name: 'Clotianidina (Insecticida)',
    description: 'Neonicotinoide de segunda generación con alta toxicidad para polinizadores.',
    targetOrgans: 'Sistema Nervioso, Hígado.',
    source: 'EFSA'
  },
  'spinetoram': { 
    adi: 0.05, 
    unit: 'mg/kg·día', 
    name: 'Espinetoram (Insecticida)', 
    description: 'Insecticida derivado de la fermentación de Saccharopolyspora spinosa, similar al spinosad pero con mayor potencia.',
    targetOrgans: 'Sistema Nervioso, Tiroides.',
    source: 'JMPR / EPA'
  },
  'indoxacarb': { 
    adi: 0.01, 
    unit: 'mg/kg·día', 
    name: 'Indoxacarb (Insecticida)', 
    description: 'Oxadiazina que bloquea los canales de sodio dependientes de voltaje en los insectos.',
    targetOrgans: 'Sistema Nervioso, Sangre (Metahemoglobinemia).',
    source: 'JMPR / EFSA'
  },
  'chlorantraniliprole': { 
    adi: 1.56, 
    unit: 'mg/kg·día', 
    name: 'Clorantraniliprol (Insecticida)', 
    description: 'Insecticida de la familia de las diamidas antranílicas que activa los receptores de rianodina de los insectos.',
    targetOrgans: 'Hígado (inducción enzimática), Músculos.',
    source: 'JMPR / EFSA'
  },
  'sulfoxaflor': { 
    adi: 0.05, 
    unit: 'mg/kg·día', 
    name: 'Sulfoxaflor (Insecticida)', 
    description: 'Insecticida de la clase de las sulfoximinas que actúa sobre los receptores nicotínicos de acetilcolina.',
    targetOrgans: 'Hígado, Riñones.',
    source: 'EFSA / JMPR'
  },

  // Herbicidas
  'glyphosate': { 
    adi: 0.5, 
    unit: 'mg/kg·día', 
    name: 'Glifosato',
    description: 'Herbicida sistémico no selectivo de amplio espectro, muy utilizado en agricultura.',
    targetOrgans: 'Hígado, Riñones, Sistema Gastrointestinal.',
    source: 'JECFA / EPA (Environmental Protection Agency)'
  },
  'atrazine': { 
    adi: 0.005, 
    unit: 'mg/kg·día', 
    name: 'Atrazina (Herbicida)',
    description: 'Herbicida de la familia de las triazinas que interfiere con la fotosíntesis. Persistente en agua.',
    targetOrgans: 'Sistema Endocrino (Disruptor), Sistema Reproductivo, Hígado.',
    source: 'EFSA / EPA'
  },
  '24_d': { 
    adi: 0.01, 
    unit: 'mg/kg·día', 
    name: '2,4-D (Herbicida)',
    description: 'Herbicida hormonal que imita a la auxina, provocando un crecimiento descontrolado en malezas.',
    targetOrgans: 'Riñones, Hígado, Sistema Nervioso, Músculos.',
    source: 'JMPR / EFSA'
  },
  'paraquat': { 
    adi: 0.005, 
    unit: 'mg/kg·día', 
    name: 'Paraquat (Herbicida)',
    description: 'Herbicida de contacto altamente tóxico que genera radicales libres de oxígeno dañando las membranas.',
    targetOrgans: 'Pulmones (Fibrosis), Riñones, Hígado, Ojos.',
    source: 'JMPR'
  },
  'diuron': { 
    adi: 0.007, 
    unit: 'mg/kg·día', 
    name: 'Diurón (Herbicida)',
    description: 'Herbicida derivado de la urea que inhibe el transporte de electrones en el fotosistema II.',
    targetOrgans: 'Sangre (Metahemoglobinemia), Hígado, Bazo.',
    source: 'EPA'
  },
  'linuron': { 
    adi: 0.003, 
    unit: 'mg/kg·día', 
    name: 'Linurón (Herbicida)',
    description: 'Herbicida de la familia de las ureas sustituidas; actúa bloqueando la fotosíntesis.',
    targetOrgans: 'Sangre (Eritrocitos), Hígado, Glándula Tiroides.',
    source: 'EFSA / EPA'
  },
  'metribuzin': { 
    adi: 0.013, 
    unit: 'mg/kg·día', 
    name: 'Metribuzina (Herbicida)',
    description: 'Herbicida de la familia de las triazinonas utilizado para el control de malezas pre y post-emergencia.',
    targetOrgans: 'Hígado, Riñones, Glándula Tiroides.',
    source: 'JMPR'
  },
  'pendimethalin': { 
    adi: 0.125, 
    unit: 'mg/kg·día', 
    name: 'Pendimetalina (Herbicida)',
    description: 'Dinitroanilina que inhibe la mitosis celular en el desarrollo de raíces y brotes de malezas.',
    targetOrgans: 'Hígado, Glándula Tiroides.',
    source: 'EPA / JMPR'
  },
  'bentazone': { 
    adi: 0.1, 
    unit: 'mg/kg·día', 
    name: 'Bentazona (Herbicida)',
    description: 'Herbicida de contacto post-emergencia que actúa bloqueando la fotosíntesis en malezas de hoja ancha.',
    targetOrgans: 'Riñones, Hígado, Sangre.',
    source: 'JMPR / EFSA'
  },
  'dicamba': {
    adi: 0.3,
    unit: 'mg/kg·día',
    name: 'Dicamba (Herbicida)',
    description: 'Herbicida selectivo derivado del ácido benzoico que actúa como regulador del crecimiento vegetal.',
    targetOrgans: 'Hígado, Riñones.',
    source: 'EFSA'
  },
  'metolachlor': {
    adi: 0.1,
    unit: 'mg/kg·día',
    name: 'Metolacloro (Herbicida)',
    description: 'Herbicida de la familia de las cloroacetamidas utilizado ampliamente en maíz y soja.',
    targetOrgans: 'Hígado, Riñones.',
    source: 'EPA'
  },
  'clomazone': {
    adi: 0.12,
    unit: 'mg/kg·día',
    name: 'Clomazona (Herbicida)',
    description: 'Herbicida que inhibe la biosíntesis de pigmentos fotosintéticos (isoprenoides).',
    targetOrgans: 'Hígado.',
    source: 'EFSA'
  },
  'trifluralin': {
    adi: 0.015,
    unit: 'mg/kg·día',
    name: 'Trifluralina (Herbicida)',
    description: 'Dinitroanilina que inhibe la mitosis mediante la interferencia con la polimerización de la tubulina.',
    targetOrgans: 'Hígado, Tiroides, Sangre.',
    source: 'EFSA / EPA'
  },

  // Fungicidas
  'tebuconazole': { 
    adi: 0.03, 
    unit: 'mg/kg·día', 
    name: 'Tebuconazol',
    description: 'Triazol sistémico que inhibe la biosíntesis del ergosterol en la membrana celular del hongo.',
    targetOrgans: 'Hígado, Sistema Endocrino, Sistema Reproductivo.',
    source: 'JMPR / EFSA'
  },
  'thiabendazole': { 
    adi: 0.1, 
    unit: 'mg/kg·día', 
    name: 'Tiabendazol',
    description: 'Benzimidazol utilizado como fungicida post-cosecha y antihelmíntico en medicina veterinaria.',
    targetOrgans: 'Riñones, Glándula Tiroides, Hígado.',
    source: 'JECFA / JMPR'
  },
  'carbendazim': { 
    adi: 0.03, 
    unit: 'mg/kg·día', 
    name: 'Carbendazima',
    description: 'Benzimidazol sistémico que interfiere con la división celular del hongo (microtúbulos).',
    targetOrgans: 'Testículos (Espermatogénesis), Hígado, Sistema Inmunológico.',
    source: 'JMPR / EFSA'
  },
  'propiconazole': { 
    adi: 0.07, 
    unit: 'mg/kg·día', 
    name: 'Propiconazol',
    description: 'Fungicida triazol sistémico de amplio espectro utilizado en diversos cultivos y madera.',
    targetOrgans: 'Hígado (hipertrofia), Glándula Tiroides.',
    source: 'JMPR'
  },
  'boscalid': { 
    adi: 0.04, 
    unit: 'mg/kg·día', 
    name: 'Boscalid',
    description: 'Fungicida de la clase carboxamida que actúa inhibiendo la respiración mitocondrial.',
    targetOrgans: 'Hígado, Glándula Tiroides.',
    source: 'JMPR / EFSA'
  },
  'azoxystrobin': { 
    adi: 0.2, 
    unit: 'mg/kg·día', 
    name: 'Azoxistrobina',
    description: 'Fungicida estrobirulina de amplio espectro derivado de hongos naturales del género Strobilurus.',
    targetOrgans: 'Hígado, Sistema Gastrointestinal (irritación).',
    source: 'JMPR / EFSA'
  },
  'chlorothalonil': { 
    adi: 0.02, 
    unit: 'mg/kg·día', 
    name: 'Clorotalonil',
    description: 'Fungicida no sistémico de amplio espectro que inactiva grupos tiol en enzimas celulares.',
    targetOrgans: 'Riñones (necrosis tubular), Tracto Gastrointestinal.',
    source: 'JMPR'
  },
  'cyprodinil': { 
    adi: 0.03, 
    unit: 'mg/kg·día', 
    name: 'Ciprodinil',
    description: 'Anilinopirimidina que inhibe la biosíntesis de metionina en hongos patógenos.',
    targetOrgans: 'Hígado, Riñones, Glándula Tiroides.',
    source: 'JMPR / EFSA'
  },
  'difenoconazole': { 
    adi: 0.01, 
    unit: 'mg/kg·día', 
    name: 'Difenoconazol',
    description: 'Triazol sistémico de larga duración con excelente actividad preventiva y curativa.',
    targetOrgans: 'Hígado, Sistema Endocrino.',
    source: 'JMPR'
  },
  'captan': { 
    adi: 0.1, 
    unit: 'mg/kg·día', 
    name: 'Captan (Fungicida)',
    description: 'Fungicida protector de la familia de las ftalimidas, interfiere con la respiración fúngica.',
    targetOrgans: 'Tracto Gastrointestinal, Piel, Riñones.',
    source: 'JMPR'
  },
  'mancozeb': { 
    adi: 0.05, 
    unit: 'mg/kg·día', 
    name: 'Mancozeb (Fungicida)',
    description: 'Ditiocarbamato complejo de zinc y manganeso que actúa sobre múltiples sitios celulares del hongo.',
    targetOrgans: 'Glándula Tiroides (vía ETU), Hígado, Sistema Reproductivo.',
    source: 'JMPR / EFSA'
  },
  'metalaxyl': { 
    adi: 0.08, 
    unit: 'mg/kg·día', 
    name: 'Metalaxil (Fungicida)',
    description: 'Fungicida de las fenilamidas que inhibe la síntesis de ARN polimerasa en oomicetos.',
    targetOrgans: 'Hígado, Sangre, Testículos.',
    source: 'JMPR'
  },
  'folpet': { 
    adi: 0.1, 
    unit: 'mg/kg·día', 
    name: 'Folpet (Fungicida)',
    description: 'Fungicida protector similar al captán, utilizado frecuentemente en viñedos y frutales.',
    targetOrgans: 'Tracto Gastrointestinal, Hígado.',
    source: 'JMPR'
  },
  'iprodione': { 
    adi: 0.06, 
    unit: 'mg/kg·día', 
    name: 'Iprodiona (Fungicida)',
    description: 'Dicarboximida de contacto que interfiere con la señalización osmótica y división celular fúngica.',
    targetOrgans: 'Glándulas Adrenales, Hígado, Testículos.',
    source: 'JMPR / EFSA'
  },
  'pyrimethanil': { 
    adi: 0.17, 
    unit: 'mg/kg·día', 
    name: 'Pirimetanil (Fungicida)',
    description: 'Anilinopirimidina que inhibe la biosíntesis de metionina y la secreción de enzimas hidrolíticas.',
    targetOrgans: 'Hígado, Glándula Tiroides.',
    source: 'JMPR / EFSA'
  },
  'fludioxonil': {
    adi: 0.4,
    unit: 'mg/kg·día',
    name: 'Fludioxonil (Fungicida)',
    description: 'Fungicida de contacto de la familia de los fenilpirroles, muy utilizado en post-cosecha.',
    targetOrgans: 'Hígado, Riñones.',
    source: 'JMPR'
  },
  'pyraclostrobin': {
    adi: 0.03,
    unit: 'mg/kg·día',
    name: 'Piraclostrobina (Fungicida)',
    description: 'Estrobirulina de amplio espectro que inhibe el transporte de electrones mitocondrial.',
    targetOrgans: 'Sistema Gastrointestinal, Hígado.',
    source: 'JMPR / EFSA'
  },
  'fluopyram': {
    adi: 0.012,
    unit: 'mg/kg·día',
    name: 'Fluopiram (Fungicida)',
    description: 'Fungicida perteneciente a la clase de las piridinil-etil-benzamidas.',
    targetOrgans: 'Hígado, Tiroides.',
    source: 'JMPR / EFSA'
  },
  'trifloxystrobin': {
    adi: 0.04,
    unit: 'mg/kg·día',
    name: 'Trifloxistrobina (Fungicida)',
    description: 'Estrobirulina con excelentes propiedades preventivas y gran adherencia a la superficie de la planta.',
    targetOrgans: 'Hígado, Sistema Inmune.',
    source: 'JMPR / EFSA'
  },
  'penconazole': {
    adi: 0.03,
    unit: 'mg/kg·día',
    name: 'Penconazol (Fungicida)',
    description: 'Triazol sistémico utilizado para el control de oídio en viñedos y frutales.',
    targetOrgans: 'Hígado, Riñones.',
    source: 'JMPR'
  },
  'epoxiconazole': {
    adi: 0.008,
    unit: 'mg/kg·día',
    name: 'Epoxiconazol (Fungicida)',
    description: 'Fungicida triazol sistémico de amplio espectro utilizado principalmente en cereales.',
    targetOrgans: 'Hígado, Sistema Endocrino.',
    source: 'EFSA'
  },
  'kresoxim_methyl': {
    adi: 0.3,
    unit: 'mg/kg·día',
    name: 'Kresoxim-metilo (Fungicida)',
    description: 'Fungicida estrobirulina con actividad protectora, curativa y de erradicación.',
    targetOrgans: 'Hígado.',
    source: 'EFSA'
  },
  'fenpropimorph': {
    adi: 0.004,
    unit: 'mg/kg·día',
    name: 'Fenpropimorf (Fungicida)',
    description: 'Fungicida sistémico que inhibe la biosíntesis de ergosterol en una etapa diferente a los triazoles.',
    targetOrgans: 'Hígado, Sistema Reproductivo.',
    source: 'EFSA'
  },
  'imazalil': {
    adi: 0.03,
    unit: 'mg/kg·día',
    name: 'Imazalil (Fungicida)',
    description: 'Fungicida de la clase imidazol ampliamente utilizado para el tratamiento de cítricos post-cosecha.',
    targetOrgans: 'Hígado, Tiroides.',
    source: 'JMPR / EFSA'
  },
  'prochloraz': {
    adi: 0.01,
    unit: 'mg/kg·día',
    name: 'Procloraz (Fungicida)',
    description: 'Fungicida imidazol de amplio espectro que inhibe la biosíntesis de ergosterol.',
    targetOrgans: 'Hígado, Sistema Endocrino (Disrupción).',
    source: 'JMPR / EFSA'
  },

  // Micotoxinas y Metales
  'ochratoxin_a': { 
    adi: 14.5, 
    unit: 'μg/kg·día', 
    name: 'Ocratoxina A',
    description: 'Micotoxina producida por hongos de los géneros Aspergillus y Penicillium. Es persistente y se acumula en la cadena alimentaria.',
    targetOrgans: 'Riñones (nefrotoxicidad), Hígado, Sistema Inmunológico.',
    source: 'JECFA / EFSA'
  },
  'aflatoxin_b1': { 
    adi: 0.40, 
    unit: 'μg/kg·día', 
    name: 'Aflatoxina B1',
    description: 'Micotoxina altamente hepatotóxica y carcinogénica (IARC Grupo 1). Es una de las sustancias más potentes causantes de cáncer de hígado (carcinoma hepatocelular). EFSA (2020) y JECFA (2017) recomiendan evaluar el riesgo mediante el Margen de Exposición (MOE) con base en el BMDL10 animal de 0,40 µg/kg pc/día.',
    targetOrgans: 'Hígado (Cáncer de hígado / Hepatocarcinoma), Riñones, Sistema Inmune.',
    source: 'EFSA CONTAM Panel (2020) / JECFA (2017) / IARC Grupo 1'
  },
  'deoxynivalenol': { 
    adi: 1, 
    unit: 'μg/kg·día', 
    name: 'Deoxinivalenol (DON)',
    description: 'Tricoteceno producido por Fusarium. Comúnmente llamada vomitoxina, interfiere con la síntesis de proteínas a nivel celular.',
    targetOrgans: 'Sistema Gastrointestinal, Sistema Inmunológico, Médula Ósea.',
    source: 'JECFA'
  },
  'patulin': { 
    adi: 0.4, 
    unit: 'μg/kg·día', 
    name: 'Patulina',
    description: 'Micotoxina detectada principalmente en manzanas y productos derivados en mal estado. Posee propiedades antibióticas pero es altamente tóxica para humanos.',
    targetOrgans: 'Tracto Gastrointestinal (hemorragias), Riñones, Sistema Nervioso.',
    source: 'JECFA'
  },
  'lead': { 
    adi: 5, 
    unit: 'μg/kg·día', 
    name: 'Plomo',
    description: 'Metal pesado acumulativo que afecta prácticamente a todos los sistemas del cuerpo. Especialmente crítico en el desarrollo infantil.',
    targetOrgans: 'Sistema Nervioso Central (neurotoxicidad), Sistema Hematopoyético (Anemia), Riñones, Huesos.',
    source: 'JECFA / EFSA Contam Panel'
  },
  'cadmium': { 
    adi: 1, 
    unit: 'μg/kg·día', 
    name: 'Cadmio',
    description: 'Contaminante ambiental persistente. Se acumula en el cuerpo durante décadas, afectando principalmente el metabolismo mineral.',
    targetOrgans: 'Riñones (disfunción tubular), Huesos (osteomalacia), Hígado, Pulmones.',
    source: 'EFSA (Tolerable Weekly Intake - TWI converted to Daily)'
  },
  'mercury': { 
    adi: 4, 
    unit: 'μg/kg·día', 
    name: 'Mercurio',
    description: 'Metal pesado inorgánico con alta afinidad por grupos sulfhidrilo, lo que altera numerosas funciones enzimáticas y celulares.',
    targetOrgans: 'Riñones (nefrosis), Sistema Nervioso Periférico, Tracto Gastrointestinal.',
    source: 'JECFA'
  },
  'methylmercury': { 
    adi: 1.3, 
    unit: 'μg/kg·día', 
    name: 'Metilmercurio',
    description: 'Forma orgánica del mercurio extremadamente neurotóxica. Atraviesa la barrera hematoencefálica y la placenta con gran eficiencia.',
    targetOrgans: 'Sistema Nervioso Central (Corteza y Cerebelo), Feto (daño neurológico irreversible).',
    source: 'EFSA / JECFA'
  },
  'arsenic': { 
    adi: 0.06, 
    unit: 'μg/kg·día', 
    name: 'Arsénico inorgánico',
    description: 'Forma inorgánica del arsénico (arsenito As(III) y arseniato As(V)), de máxima relevancia toxicológica en alimentos (como arroz y derivados) y agua potable. JECFA y EFSA determinaron que no es apropiado fijar un umbral (IDA tradicional), empleándose puntos de partida (PoD / BMDL) para evaluar el Margen de Exposición (MOE). El valor por defecto corresponde a la reevaluación EFSA 2024 (BMDL05 = 0,06 µg/kg pc/día).',
    targetOrgans: 'Carcinógeno humano confirmado (IARC Grupo 1). Provoca principalmente cáncer de piel, pulmón y vejiga.',
    source: 'EFSA CONTAM Panel (2024) / JECFA (2010)'
  },
  
  // Otros
  'nitrates': { 
    adi: 3.7, 
    unit: 'mg/kg·día', 
    name: 'Nitratos',
    description: 'Iones inorgánicos presentes naturalmente en vegetales y agua, también usados como fertilizantes y conservantes.',
    targetOrgans: 'Sangre (Metahemoglobinemia), Sistema Gastrointestinal.',
    source: 'JECFA / EFSA'
  },
  'bisphenol_a': { 
    adi: 4, 
    unit: 'μg/kg·día', 
    name: 'Bisfenol A',
    description: 'Compuesto químico utilizado para fabricar plásticos de policarbonato y resinas epoxi; conocido disruptor endocrino.',
    targetOrgans: 'Sistema Endocrino, Sistema Reproductivo, Glándula Mamaria.',
    source: 'EFSA (Tolerable Daily Intake - TDI)'
  },
  'acrylamide': { 
    adi: 0.17, 
    unit: 'μg/kg·día', 
    name: 'Acrilamida',
    description: 'Compuesto formado naturalmente en alimentos ricos en almidón durante procesos de cocción a altas temperaturas (Maillard).',
    targetOrgans: 'Sistema Nervioso (neurotoxicidad), Sistema Reproductivo, Potencial Carcinogénico.',
    source: 'JECFA / EFSA'
  },
  
  // Veterinarios
  'ivermectin': { 
    adi: 0.001, 
    unit: 'mg/kg·día', 
    name: 'Ivermectina',
    description: 'Antiparasitario de amplio espectro utilizado en animales y humanos; aumenta la permeabilidad de la membrana nerviosa.',
    targetOrgans: 'Sistema Nervioso Central (si se atraviesa la BHE), Hígado.',
    source: 'JECFA'
  },
  'oxytetracycline': { 
    adi: 0.03, 
    unit: 'mg/kg·día', 
    name: 'Oxitetraciclina',
    description: 'Antibiótico de amplio espectro del grupo de las tetraciclinas que inhibe la síntesis proteica bacteriana.',
    targetOrgans: 'Dientes y Huesos (calcificación), Hígado, Sistema Gastrointestinal.',
    source: 'JECFA'
  },
  'doxycycline': { 
    adi: 0.003, 
    unit: 'mg/kg·día', 
    name: 'Doxiciclina',
    description: 'Tetraciclina semisintética de larga duración; utilizada para tratar diversas infecciones bacterianas y parasitarias.',
    targetOrgans: 'Sistema Gastrointestinal, Hígado, Dientes/Huesos.',
    source: 'JECFA'
  },
  'enrofloxacin': { 
    adi: 0.002, 
    unit: 'mg/kg·día', 
    name: 'Enrofloxacina',
    description: 'Fluoroquinolona de uso exclusivamente veterinario; inhibe la ADN girasa bacteriana.',
    targetOrgans: 'Cartílago (artropatía en jóvenes), Riñones, Sistema Nervioso.',
    source: 'JECFA / EFSA'
  },
  'sulfadiazine': { 
    adi: 0.05, 
    unit: 'mg/kg·día', 
    name: 'Sulfadiazina',
    description: 'Sulfonamida antimicrobiana que inhibe la síntesis de ácido fólico bacteriano.',
    targetOrgans: 'Tiroides (hiperplasia), Riñones.',
    source: 'JECFA'
  },
  'albendazole': { 
    adi: 0.05, 
    unit: 'mg/kg·día', 
    name: 'Albendazol',
    description: 'Antihelmíntico de la familia de los benzimidazoles; inhibe la polimerización de tubulina en parásitos.',
    targetOrgans: 'Hígado, Médula Ósea (Hematopoyesis).',
    source: 'JECFA'
  },
  'tilmicosin': { 
    adi: 0.04, 
    unit: 'mg/kg·día', 
    name: 'Tilmicosina',
    description: 'Antibiótico macrólido para uso veterinario; inhibe la síntesis proteica bacteriana.',
    targetOrgans: 'Corazón (Cardiotoxicidad), Hígado.',
    source: 'JECFA'
  },
  'flunixin': { 
    adi: 0.03, 
    unit: 'mg/kg·día', 
    name: 'Flunixin',
    description: 'Antiinflamatorio no esteroideo (AINE) utilizado en caballos, ganado y cerdos.',
    targetOrgans: 'Tracto Gastrointestinal (Úlceras), Riñones.',
    source: 'JECFA'
  },
  'clenbuterol': { 
    adi: 0.004, 
    unit: 'μg/kg·día', 
    name: 'Clenbuterol',
    description: 'Agonista beta-2 adrenérgico; utilizado como broncodilatador y a veces ilegalmente como promotor del crecimiento.',
    targetOrgans: 'Sistema Cardiovascular, Músculo Esquelético.',
    source: 'JECFA'
  },
  'amoxicillin': { 
    adi: 0.002, 
    unit: 'mg/kg·día', 
    name: 'Amoxicilina',
    description: 'Antibiótico betalactámico de la familia de las penicilinas; interfiere con la síntesis de la pared celular bacteriana.',
    targetOrgans: 'Sistema Gastrointestinal, Sistema Inmunológico (Alergias).',
    source: 'JECFA'
  },
  'meloxicam': { 
    adi: 0.0002, 
    unit: 'mg/kg·día', 
    name: 'Meloxicam',
    description: 'Antiinflamatorio no esteroideo (AINE) del grupo de los oxicams; inhibe preferentemente la COX-2.',
    targetOrgans: 'Tracto Gastrointestinal, Riñones, Hígado.',
    source: 'JECFA'
  }
};

export const BODY_WEIGHT_PRESETS: Record<string, number | null> = {
  'adult_male': 75,
  'adult_female': 65,
  'child_1_3': 12,
  'child_4_8': 22,
  'child_9_13': 40,
  'child_14_18': 60,
  'custom': null
};

export const TOOLTIP_TEXTS: Record<string, string> = {
  deterministic: "Un valor único y fijo, sin variabilidad.",
  uniform: "Todos los valores entre un mínimo y un máximo tienen la misma probabilidad de ocurrir.",
  triangular: "El valor más probable es la 'moda', con valores menos probables hacia el mínimo y el máximo.",
  pert: "Similar a la triangular, pero con una curva más suave. Común en la gestión de proyectos.",
  normal: "La clásica 'curva de campana'. Definida por su media (promedio) y desviación estándar (dispersión).",
  lognormal: "Una distribución donde el logaritmo de la variable se distribuye normalmente. Útil para valores que no pueden ser negativos.",
  weibull: "Una distribución flexible utilizada en análisis de fiabilidad y supervivencia.",
  erlang: "Modela la suma de 'k' variables exponenciales independientes. Usado para tiempos de espera.",
  gamma: "Una distribución flexible para valores positivos. Generalización de Erlang y Exponencial.",
  beta: "Representa valores entre un mínimo y un máximo. Útil para modelar proporciones.",
  gumbel: "Distribución de valor extremo (Tipo I), usada para modelar el máximo (o mínimo) de un conjunto de muestras.",
  frechet: "Distribución de valor extremo (Tipo II), usada para 'eventos raros' con valores muy altos.",
  inverse_weibull: "También conocida como Fréchet. Adecuada para tasas de fallo que decrecen con el tiempo.",
};

export const PARAM_TOOLTIPS: Record<string, string> = {
  value: "El valor único y fijo.",
  min: "El valor más bajo posible.",
  max: "El valor más alto posible.",
  mode: "El valor más frecuente o probable.",
  mean: "El promedio o valor central (media aritmética).",
  stddev: "La desviación estándar aritmética. Mide la dispersión observada de los datos.",
  arithmetic_mean: "Media aritmética muestral reportada en los análisis analíticos o de consumo.",
  arithmetic_stddev: "Desviación estándar aritmética muestral de los datos.",
  mu: "La media del logaritmo natural de la variable (parámetro de escala/ubicación logarítmico).",
  sigma: "La desviación estándar del logaritmo natural de la variable (parámetro de forma logarítmico).",
  shape: "Parámetro de forma (k o α).",
  scale: "Parámetro de escala (λ, θ o s).",
  rate: "Parámetro de tasa (β = 1/escala).",
  alpha: "Primer parámetro de forma (α) de la distribución Beta.",
  beta: "Segundo parámetro de forma (β) de la distribución Beta.",
  gamma: "Parámetro de forma para PERT (por defecto 4).",
  location: "Parámetro de ubicación o umbral mínimo.",
};

export const REDUCTION_TOOLTIPS: Record<string, string> = {
  name: "Nombre identificador del proceso de reducción (ej: Lavado, Cocción, Pelado).",
  prob: "Probabilidad (0-100%) de que este factor se aplique en un evento de consumo determinado (Distribución de Bernoulli).",
  eff: "Porcentaje (0-100%) de reducción de la concentración química si el factor se aplica."
};

interface FoodPreset {
  concentration: { type: DistributionType } & DistributionParams;
  concentrationUnit: string;
  consumption: { type: DistributionType } & DistributionParams;
  consumptionUnit: string;
  reduction?: {
    name: string;
    prob: number;
    eff: number;
  };
}

// Datos de ejemplo genéricos para pre-llenar el formulario
export const PREDEFINED_FOOD_DATA: Record<string, FoodPreset> = {
  // Cereales y Tubérculos
  'Arroz': {
    concentration: { type: 'normal', mean: 0.05, stdDev: 0.01 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 150, stdDev: 30 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado/Cocción', prob: 100, eff: 35 }
  },
  'Maíz': {
    concentration: { type: 'lognormal', mu: -3, sigma: 0.5 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'triangular', min: 50, mode: 100, max: 200 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Procesamiento', prob: 100, eff: 20 }
  },
  'Trigo': {
    concentration: { type: 'uniform', min: 0.01, max: 0.08 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 200, stdDev: 40 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Molienda/Cocción', prob: 100, eff: 40 }
  },
  'Avena': {
    concentration: { type: 'triangular', min: 0.01, mode: 0.03, max: 0.06 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'uniform', min: 20, max: 60 },
    consumptionUnit: 'g/día'
  },
  'Cebada': {
    concentration: { type: 'uniform', min: 0.01, max: 0.05 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 40, stdDev: 10 },
    consumptionUnit: 'g/día'
  },
  'Centeno': {
    concentration: { type: 'lognormal', mu: -3.5, sigma: 0.4 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 30, stdDev: 8 },
    consumptionUnit: 'g/día'
  },
  'Patata': {
    concentration: { type: 'normal', mean: 0.02, stdDev: 0.005 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 120, stdDev: 25 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Pelado/Cocción', prob: 95, eff: 75 }
  },
  'Yuca': {
    concentration: { type: 'uniform', min: 0.005, max: 0.02 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'triangular', min: 50, mode: 100, max: 250 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Pelado/Lavado/Cocción', prob: 100, eff: 80 }
  },
  'Pan': {
    concentration: { type: 'normal', mean: 0.03, stdDev: 0.008 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 100, stdDev: 20 },
    consumptionUnit: 'g/día'
  },
  'Pasta': {
    concentration: { type: 'uniform', min: 0.01, max: 0.04 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 80, stdDev: 15 },
    consumptionUnit: 'g/día'
  },

  // Verduras y Legumbres
  'Frijoles': {
    concentration: { type: 'lognormal', mu: -4, sigma: 0.6 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'triangular', min: 30, mode: 60, max: 100 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Remojo/Cocción', prob: 100, eff: 45 }
  },
  'Lentejas': {
    concentration: { type: 'uniform', min: 0.01, max: 0.03 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 40, stdDev: 10 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Cocción', prob: 100, eff: 35 }
  },
  'Soja': {
    concentration: { type: 'normal', mean: 0.04, stdDev: 0.01 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'uniform', min: 10, max: 50 },
    consumptionUnit: 'g/día'
  },
  'Tomate': {
    concentration: { type: 'triangular', min: 0.005, mode: 0.02, max: 0.05 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 60, stdDev: 15 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado', prob: 95, eff: 40 }
  },
  'Zanahoria': {
    concentration: { type: 'uniform', min: 0.01, max: 0.03 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 30, stdDev: 8 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Pelado/Lavado', prob: 85, eff: 65 }
  },
  'Lechuga': {
    concentration: { type: 'uniform', min: 0.05, max: 0.2 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'triangular', min: 10, mode: 30, max: 60 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado', prob: 100, eff: 45 }
  },
  'Espinaca': {
    concentration: { type: 'normal', mean: 0.1, stdDev: 0.03 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 25, stdDev: 10 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado/Cocción', prob: 100, eff: 55 }
  },
  'Cebolla': {
    concentration: { type: 'lognormal', mu: -4, sigma: 0.5 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 20, stdDev: 5 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Pelado de capas', prob: 100, eff: 90 }
  },
  'Ajo': {
    concentration: { type: 'uniform', min: 0.01, max: 0.05 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 3, stdDev: 1 },
    consumptionUnit: 'g/día'
  },
  'Brócoli': {
    concentration: { type: 'triangular', min: 0.01, mode: 0.05, max: 0.15 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 45, stdDev: 15 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado/Cocción', prob: 95, eff: 50 }
  },
  'Pepino': {
    concentration: { type: 'uniform', min: 0.02, max: 0.08 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 50, stdDev: 20 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Pelado/Lavado', prob: 80, eff: 60 }
  },
  'Pimiento': {
    concentration: { type: 'triangular', min: 0.02, mode: 0.08, max: 0.2 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 30, stdDev: 10 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado', prob: 90, eff: 35 }
  },
  'Repollo': {
    concentration: { type: 'uniform', min: 0.01, max: 0.05 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 40, stdDev: 15 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado/Eliminación capas', prob: 100, eff: 80 }
  },
  'Coliflor': {
    concentration: { type: 'uniform', min: 0.01, max: 0.04 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 35, stdDev: 10 },
    consumptionUnit: 'g/día'
  },
  'Berenjena': {
    concentration: { type: 'normal', mean: 0.03, stdDev: 0.01 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 50, stdDev: 15 },
    consumptionUnit: 'g/día'
  },
  'Calabacín': {
    concentration: { type: 'normal', mean: 0.02, stdDev: 0.008 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 60, stdDev: 20 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Pelado/Lavado', prob: 70, eff: 45 }
  },
  'Champiñón': {
    concentration: { type: 'lognormal', mu: -3, sigma: 0.6 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'exponential', rate: 0.04 }, // Avg ~25g
    consumptionUnit: 'g/día'
  },
  'Calabaza': {
    concentration: { type: 'lognormal', mu: -3.5, sigma: 0.4 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'triangular', min: 30, mode: 80, max: 150 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Pelado/Cocción', prob: 100, eff: 90 }
  },
  'Guisantes': {
    concentration: { type: 'normal', mean: 0.02, stdDev: 0.01 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 35, stdDev: 10 },
    consumptionUnit: 'g/día'
  },
  'Garbanzos': {
    concentration: { type: 'uniform', min: 0.01, max: 0.04 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 50, stdDev: 15 },
    consumptionUnit: 'g/día'
  },
  'Espárrago': {
    concentration: { type: 'uniform', min: 0.01, max: 0.03 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 30, stdDev: 10 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado/Cocción', prob: 100, eff: 40 }
  },
  'Alcachofa': {
    concentration: { type: 'normal', mean: 0.02, stdDev: 0.005 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 40, stdDev: 12 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado/Cocción', prob: 100, eff: 30 }
  },
  'Apio': {
    concentration: { type: 'uniform', min: 0.05, max: 0.15 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 20, stdDev: 5 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado', prob: 100, eff: 45 }
  },
  'Rábano': {
    concentration: { type: 'uniform', min: 0.01, max: 0.04 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 15, stdDev: 5 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado', prob: 100, eff: 30 }
  },
  'Remolacha': {
    concentration: { type: 'normal', mean: 0.03, stdDev: 0.01 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 40, stdDev: 15 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Pelado/Cocción', prob: 100, eff: 70 }
  },
  'Acelga': {
    concentration: { type: 'uniform', min: 0.05, max: 0.2 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 30, stdDev: 10 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado/Cocción', prob: 100, eff: 50 }
  },
  'Puerro': {
    concentration: { type: 'uniform', min: 0.02, max: 0.06 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 25, stdDev: 8 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado/Cocción', prob: 100, eff: 40 }
  },
  'Rúcula': {
    concentration: { type: 'uniform', min: 0.05, max: 0.25 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 20, stdDev: 5 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado', prob: 100, eff: 45 }
  },
  'Col rizada (Kale)': {
    concentration: { type: 'normal', mean: 0.08, stdDev: 0.02 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 30, stdDev: 10 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado/Cocción', prob: 100, eff: 50 }
  },
  'Cilantro': {
    concentration: { type: 'triangular', min: 0.02, mode: 0.1, max: 0.3 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 5, stdDev: 2 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado', prob: 100, eff: 40 }
  },
  'Nopal': {
    concentration: { type: 'uniform', min: 0.01, max: 0.05 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 60, stdDev: 20 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Limpieza/Cocción', prob: 100, eff: 60 }
  },
  'Col de Bruselas': {
    concentration: { type: 'triangular', min: 0.01, mode: 0.04, max: 0.1 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 35, stdDev: 12 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado/Cocción', prob: 100, eff: 45 }
  },
  'Habas': {
    concentration: { type: 'uniform', min: 0.01, max: 0.05 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 45, stdDev: 15 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Cocción', prob: 100, eff: 35 }
  },
  'Judías Verdes': {
    concentration: { type: 'normal', mean: 0.04, stdDev: 0.015 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 50, stdDev: 15 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado/Cocción', prob: 100, eff: 45 }
  },

  // Frutas
  'Manzana': {
    concentration: { type: 'uniform', min: 0.01, max: 0.05 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 100, stdDev: 20 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado/Pelado', prob: 85, eff: 55 }
  },
  'Banano': {
    concentration: { type: 'uniform', min: 0.005, max: 0.02 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 120, stdDev: 30 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Pelado', prob: 100, eff: 95 }
  },
  'Naranja': {
    concentration: { type: 'triangular', min: 0.01, mode: 0.03, max: 0.08 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 150, stdDev: 40 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Pelado', prob: 100, eff: 98 }
  },
  'Uva': {
    concentration: { type: 'normal', mean: 0.05, stdDev: 0.02 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'uniform', min: 50, max: 150 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado', prob: 95, eff: 45 }
  },
  'Fresa': {
    concentration: { type: 'lognormal', mu: -2.5, sigma: 0.7 }, // Tiende a tener residuos más altos
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 60, stdDev: 20 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado', prob: 100, eff: 40 }
  },
  'Piña': {
    concentration: { type: 'uniform', min: 0.01, max: 0.04 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 100, stdDev: 40 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Pelado', prob: 100, eff: 95 }
  },
  'Sandía': {
    concentration: { type: 'uniform', min: 0.005, max: 0.03 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'triangular', min: 100, mode: 250, max: 500 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Pelado', prob: 100, eff: 99 }
  },
  'Melón': {
    concentration: { type: 'uniform', min: 0.005, max: 0.03 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'triangular', min: 100, mode: 200, max: 400 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Pelado', prob: 100, eff: 99 }
  },
  'Melocotón': {
    concentration: { type: 'normal', mean: 0.04, stdDev: 0.02 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 120, stdDev: 30 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Pelado/Lavado', prob: 90, eff: 60 }
  },
  'Pera': {
    concentration: { type: 'normal', mean: 0.03, stdDev: 0.01 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 130, stdDev: 35 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Pelado/Lavado', prob: 80, eff: 65 }
  },
  'Limón': {
    concentration: { type: 'triangular', min: 0.02, mode: 0.05, max: 0.1 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'lognormal', mu: 2, sigma: 0.5 }, // Consumo bajo (zumo/garnish)
    consumptionUnit: 'g/día',
    reduction: { name: 'Pelado (solo zumo)', prob: 90, eff: 95 }
  },
  'Cereza': {
    concentration: { type: 'triangular', min: 0.02, mode: 0.06, max: 0.15 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 80, stdDev: 20 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado', prob: 100, eff: 40 }
  },
  'Kiwi': {
    concentration: { type: 'uniform', min: 0.01, max: 0.05 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 70, stdDev: 15 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Pelado', prob: 100, eff: 95 }
  },
  'Mango': {
    concentration: { type: 'uniform', min: 0.01, max: 0.04 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 150, stdDev: 40 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Pelado', prob: 100, eff: 95 }
  },
  'Aguacate': {
    concentration: { type: 'uniform', min: 0.005, max: 0.02 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 80, stdDev: 30 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Pelado', prob: 100, eff: 98 }
  },
  'Arándano': {
    concentration: { type: 'normal', mean: 0.05, stdDev: 0.02 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 40, stdDev: 10 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado', prob: 100, eff: 35 }
  },
  'Frambuesa': {
    concentration: { type: 'normal', mean: 0.06, stdDev: 0.02 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 40, stdDev: 10 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado', prob: 100, eff: 35 }
  },
  'Mora': {
    concentration: { type: 'normal', mean: 0.05, stdDev: 0.02 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 35, stdDev: 10 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado', prob: 100, eff: 35 }
  },
  'Granada': {
    concentration: { type: 'uniform', min: 0.01, max: 0.03 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 60, stdDev: 20 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Pelado', prob: 100, eff: 98 }
  },
  'Higo': {
    concentration: { type: 'uniform', min: 0.01, max: 0.04 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 50, stdDev: 15 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado', prob: 100, eff: 30 }
  },
  'Papaya': {
    concentration: { type: 'uniform', min: 0.005, max: 0.02 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 150, stdDev: 40 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Pelado', prob: 100, eff: 95 }
  },
  'Guayaba': {
    concentration: { type: 'normal', mean: 0.03, stdDev: 0.01 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 80, stdDev: 25 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado', prob: 100, eff: 40 }
  },
  'Maracuyá': {
    concentration: { type: 'uniform', min: 0.01, max: 0.05 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 50, stdDev: 15 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Pelado (solo pulpa)', prob: 100, eff: 98 }
  },
  'Pitaya': {
    concentration: { type: 'uniform', min: 0.005, max: 0.02 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 100, stdDev: 30 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Pelado', prob: 100, eff: 95 }
  },
  'Guanábana': {
    concentration: { type: 'uniform', min: 0.01, max: 0.03 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 120, stdDev: 40 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Pelado', prob: 100, eff: 95 }
  },
  'Chirimoya': {
    concentration: { type: 'uniform', min: 0.01, max: 0.04 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 130, stdDev: 35 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Pelado', prob: 100, eff: 95 }
  },
  'Albaricoque': {
    concentration: { type: 'normal', mean: 0.04, stdDev: 0.015 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 60, stdDev: 15 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado/Pelado', prob: 90, eff: 55 }
  },
  'Ciruela': {
    concentration: { type: 'normal', mean: 0.03, stdDev: 0.01 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 70, stdDev: 20 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado', prob: 100, eff: 40 }
  },
  'Nectarina': {
    concentration: { type: 'normal', mean: 0.04, stdDev: 0.02 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 100, stdDev: 25 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Lavado', prob: 100, eff: 40 }
  },
  'Coco': {
    concentration: { type: 'uniform', min: 0, max: 0.01 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 40, stdDev: 15 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Pelado', prob: 100, eff: 99 }
  },
  'Dátiles': {
    concentration: { type: 'uniform', min: 0.01, max: 0.05 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 30, stdDev: 10 },
    consumptionUnit: 'g/día'
  },

  // Frutos Secos
  'Almendra': {
    concentration: { type: 'uniform', min: 0.01, max: 0.05 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 30, stdDev: 10 },
    consumptionUnit: 'g/día'
  },
  'Nuez': {
    concentration: { type: 'uniform', min: 0.01, max: 0.06 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 25, stdDev: 8 },
    consumptionUnit: 'g/día'
  },
  'Cacahuete': {
    concentration: { type: 'triangular', min: 0.01, mode: 0.05, max: 0.2 }, // Aflatoxins risk
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 35, stdDev: 15 },
    consumptionUnit: 'g/día'
  },
  'Pistacho': {
    concentration: { type: 'uniform', min: 0.01, max: 0.1 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 20, stdDev: 8 },
    consumptionUnit: 'g/día'
  },

  // Origen Animal
  'Leche': {
    concentration: { type: 'lognormal', mu: -5, sigma: 0.4 },
    concentrationUnit: 'mg/L',
    consumption: { type: 'normal', mean: 250, stdDev: 50 },
    consumptionUnit: 'mL/día'
  },
  'Carne Res': {
    concentration: { type: 'normal', mean: 0.02, stdDev: 0.005 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'triangular', min: 50, mode: 100, max: 200 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Cocción', prob: 100, eff: 25 }
  },
  'Carne Pollo': {
    concentration: { type: 'uniform', min: 0.01, max: 0.04 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 100, stdDev: 25 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Cocción', prob: 100, eff: 30 }
  },
  'Carne Cerdo': {
    concentration: { type: 'normal', mean: 0.02, stdDev: 0.005 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'triangular', min: 50, mode: 100, max: 200 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Cocción', prob: 100, eff: 25 }
  },
  'Carne Cordero': {
    concentration: { type: 'uniform', min: 0.01, max: 0.03 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 80, stdDev: 20 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Cocción', prob: 100, eff: 25 }
  },
  'Huevo': {
    concentration: { type: 'uniform', min: 0.005, max: 0.02 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 55, stdDev: 10 },
    consumptionUnit: 'g/día'
  },
  'Pescado': {
    concentration: { type: 'lognormal', mu: -2, sigma: 0.8 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'triangular', min: 50, mode: 120, max: 250 },
    consumptionUnit: 'g/día',
    reduction: { name: 'Cocción/Limpieza', prob: 100, eff: 20 }
  },
  'Marisco': {
    concentration: { type: 'lognormal', mu: -1.5, sigma: 0.7 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'exponential', rate: 0.02 },
    consumptionUnit: 'g/día'
  },
  'Queso': {
    concentration: { type: 'uniform', min: 0.02, max: 0.1 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 40, stdDev: 10 },
    consumptionUnit: 'g/día'
  },
  'Yogur': {
    concentration: { type: 'normal', mean: 0.01, stdDev: 0.003 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 125, stdDev: 25 },
    consumptionUnit: 'g/día'
  },
  'Mantequilla': {
    concentration: { type: 'lognormal', mu: -3, sigma: 0.5 }, // Lipophilic compounds
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 15, stdDev: 5 },
    consumptionUnit: 'g/día'
  },

  // Otros
  'Agua': {
    concentration: { type: 'uniform', min: 0, max: 0.005 },
    concentrationUnit: 'mg/L',
    consumption: { type: 'normal', mean: 2000, stdDev: 500 },
    consumptionUnit: 'mL/día',
    reduction: { name: 'Filtrado', prob: 60, eff: 80 }
  },
  'Aceite': {
    concentration: { type: 'uniform', min: 0.01, max: 0.1 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 30, stdDev: 10 },
    consumptionUnit: 'g/día'
  },
  'Café': {
    concentration: { type: 'normal', mean: 0.08, stdDev: 0.02 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'lognormal', mu: 4.5, sigma: 0.5 }, // aprox 100-200ml
    consumptionUnit: 'mL/día',
    reduction: { name: 'Tostado/Preparación', prob: 100, eff: 90 }
  },
  'Té': {
    concentration: { type: 'uniform', min: 0.05, max: 0.2 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'lognormal', mu: 4.8, sigma: 0.4 }, // ~200ml
    consumptionUnit: 'mL/día',
    reduction: { name: 'Infusión', prob: 100, eff: 85 }
  },
  'Chocolate': {
    concentration: { type: 'normal', mean: 0.05, stdDev: 0.02 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'exponential', rate: 0.05 }, 
    consumptionUnit: 'g/día'
  },
  'Miel': {
    concentration: { type: 'uniform', min: 0.001, max: 0.01 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'exponential', rate: 0.1 }, // Avg ~10g
    consumptionUnit: 'g/día'
  },
  'Azúcar': {
    concentration: { type: 'deterministic', value: 0.005 },
    concentrationUnit: 'mg/kg',
    consumption: { type: 'normal', mean: 40, stdDev: 10 },
    consumptionUnit: 'g/día'
  },
  'Vino': {
    concentration: { type: 'uniform', min: 0, max: 0.05 },
    concentrationUnit: 'mg/L',
    consumption: { type: 'gamma', shape: 2, rate: 0.01 }, // Occasional consumption model
    consumptionUnit: 'mL/día'
  },
  'Cerveza': {
    concentration: { type: 'uniform', min: 0, max: 0.02 },
    concentrationUnit: 'mg/L',
    consumption: { type: 'gamma', shape: 3, rate: 0.01 },
    consumptionUnit: 'mL/día'
  }
};
