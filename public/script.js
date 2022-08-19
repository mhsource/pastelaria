let andamento = 1
let timeout;

function config(){
  document.getElementsByClassName("pedir")[0].style.display = ""
  document.getElementsByClassName("andamento")[0].style.display = "none"
}

async function enviarPedido() {
  const nome = document.getElementById("nome").value;
  const telefone = document.getElementById("telefone").value;
  const endereco = document.getElementById("endereco").value;
  const radios = document.getElementsByName("options");
  let pedido;
  for (const radioButton of radios) {
    if (radioButton.checked) {
      pedido = radioButton.value;
      break;
    }
  }

  axios({
    method: 'post',
    url: 'http://localhost:8080/engine-rest/process-definition/key/criarPedido/submit-form',
    headers: {
      'Content-Type': 'application/json'
    },
    data: JSON.stringify({
      "variables": {
        "nome": { "value": nome, "type": "String" },
        "telefone": { "value": telefone, "type": "String" },
        "endereco": { "value": endereco, "type": "String" },
        "pedido": { "value": pedido, "type": "String" },
        "status": { "value": 1, "type": "Integer" },
      }
    })
  })
    .then(function (response) {
      document.getElementsByClassName("pedir")[0].style.display = "none"
      document.getElementsByClassName("andamento")[0].style.display = ""
      localStorage.setItem("id", response.data.id)
      andamentoPedido()
    })
    .catch(function (error) {
      console.log(error);
    });
}

function timer(metodo) {
  timeout = setTimeout(metodo, 10000);
}

async function andamentoPedido() {

  const id = localStorage.getItem("id")

  const variables = await axios({
    method: 'get',
    url: `http://localhost:8080/engine-rest/history/variable-instance?processInstanceId=${id}`,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  for (let index = 0; index < variables.data.length; index++) {
    const element = variables.data[index];

    if (element.name == "status" && element.value == 2 && andamento != 2) {
      generateListItem('done', 'Pedido aceito', 'A pastelaria iniciou a sprint!', 2)
    }

    if (element.name == "status" && element.value == 3 && andamento != 3) {
      generateListItem('motorcycle', 'Saiu para entrega', 'A pastelaria finalizou o seu projeto!', 3)
    }

    if (element.name == "status" && element.value == 4 && andamento != 4) {
      generateListItem('close', 'Pedido não aceito', 'A pastelaria não consegue entregar seu projeto!', 4)
    }

  }

  if (andamento == 1 || andamento == 2) {
    timer(andamentoPedido)
  }

}

function generateListItem(icon, title, description, status) {
  andamento = status
  document.getElementById("ul-andamento").innerHTML += `
  <li class="mdl-list__item mdl-list__item--three-line">
              <span class="mdl-list__item-primary-content">
                <i class="material-icons  mdl-list__item-avatar">${icon}</i>
                <span>${title}</span>
                <span class="mdl-list__item-text-body">
                   ${description}
                </span>
              </span>
            </li>
  `
}

async function listaPedidos() {
  document.getElementById("pedidos").innerHTML = ''
  const pedidos = await axios({
    method: 'get',
    url: `http://localhost:8080/engine-rest/task?processDefinitionKey=criarPedido`,
    headers: {
      'Content-Type': 'application/json'
    }
  })
  for (let index = 0; index < pedidos.data.length; index++) {
    const element = pedidos.data[index];
    pedido(element.id)
  }
  timer(listaPedidos)
}

async function pedido(id) {
  const variables = await axios({
    method: 'get',
    url: `http://localhost:8080/engine-rest/task/${id}/variables`,
    headers: {
      'Content-Type': 'application/json'
    }
  })
  const {nome,telefone,endereco,pedido} = variables.data
  generateListPedidos(id,nome.value,telefone.value,endereco.value,pedido.value)
}


function generateListPedidos(id,nome, telefone, endereco, pedido) {
  document.getElementById("pedidos").innerHTML += `
  <li class="mdl-list__item mdl-list__item--three-line">
  <span class="mdl-list__item-primary-content">
    <i class="material-icons  mdl-list__item-avatar">restaurant</i>
    <span class="mdl-list__item-text-body">
      Cliente: ${nome} / Telefone: ${telefone} <br>
      Endereço: ${endereco} <br>
      Pedido: ${pedido}
    </span>
  </span>
  <span class="mdl-list__item-secondary-action">
    <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--success" onclick="enviarStatus('${id}','2')">
      Aceitar
    </button>
    <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--danger" onclick="enviarStatus('${id}','4')">
      Recusar
    </button>
  </span>
</li>
  `
}

async function enviarStatus(id,status){
  axios({
    method: 'post',
    url: `http://localhost:8080/engine-rest/task/${id}/submit-form`,
    headers: {
      'Content-Type': 'application/json'
    },
    data: JSON.stringify({
      "variables": {
        "status": { "value": status, "type": "Integer" },
      }
    })
  }).then(function (response) {
    console.log(response)
    listaPedidos()
  })
  .catch(function (error) {
    console.log(error);
  });
}