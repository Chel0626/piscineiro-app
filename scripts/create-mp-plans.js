
const https = require('https');

const ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('Erro: A variável de ambiente MERCADO_PAGO_ACCESS_TOKEN é obrigatória.');
  console.error('Uso: MERCADO_PAGO_ACCESS_TOKEN=seu_token node scripts/create-mp-plans.js');
  process.exit(1);
}

const plans = [
  {
    reason: 'Piscineiro Profissional - Mensal',
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: 29.90,
      currency_id: 'BRL'
    },
    back_url: 'https://piscineiro-app.vercel.app/dashboard',
    external_reference: 'pro_monthly'
  },
  {
    reason: 'Piscineiro Profissional - Anual',
    auto_recurring: {
      frequency: 12,
      frequency_type: 'months',
      transaction_amount: 238.80,
      currency_id: 'BRL'
    },
    back_url: 'https://piscineiro-app.vercel.app/dashboard',
    external_reference: 'pro_yearly'
  }
];

function createPlan(plan) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(plan);

    const options = {
      hostname: 'api.mercadopago.com',
      path: '/preapproval_plan',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const response = JSON.parse(body);
          resolve({
            name: plan.reason,
            id: response.id,
            init_point: response.init_point
          });
        } else {
          reject(`Erro ao criar plano ${plan.reason}: ${res.statusCode} - ${body}`);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Criando planos no Mercado Pago...');
  
  try {
    for (const plan of plans) {
      const result = await createPlan(plan);
      console.log(`✅ Plano criado: ${result.name}`);
      console.log(`   ID: ${result.id}`);
      console.log('---');
    }
    console.log('\nCopie os IDs acima e configure as variáveis de ambiente no Vercel.');
  } catch (error) {
    console.error('Falha:', error);
  }
}

main();
