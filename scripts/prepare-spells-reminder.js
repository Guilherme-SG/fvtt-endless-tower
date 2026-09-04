// Author: DroopyMcCool
// This is a WORLD SCRIPT that will automatically remind players that they may prepare new spells after a long rest.

const fullCasters = ['cleric', 'druid', 'wizard'];
const halfCasters = ['artificer', 'paladin', 'ranger'];
const prepCasters = [
  'artificer',
  'cleric',
  'druid',
  'paladin',
  'ranger',
  'wizard',
  'witch',
];

function isFullCaster(className) {
  if (fullCasters.some((c) => className.includes(c))) {
    return true;
  } else {
    return false;
  }
}

function isHalfCaster(className) {
  if (halfCasters.some((c) => className.includes(c))) {
    return true;
  } else {
    return false;
  }
}

function preparesSpells(actor) {
  const classes = Object.keys(actor.classes);
  if (prepCasters.some((c) => classes.includes(c))) {
    return true;
  } else {
    return false;
  }
}

// Automatically fires after a long rest is completed and only for player characters who prepare spells. This will fire for any owner who initiates the long rest, including the GM. Works with Rest Recovery 5e.
Hooks.on('dnd5e.restCompleted', async (actor, result) => {
  if (result.longRest && preparesSpells(actor) && actor.hasPlayerOwner) {
    const numPrepared = getPreparedSpells(actor).length;
    const numMaxPrepared = getMaxPrepared(actor);
    const data = getPreparedSpells(actor);

    function getCastingAbility(className) {
      return actor.classes[className]?.system.spellcasting.ability;
    }

    function getClassLvl(className) {
      return actor.classes[className].system.levels;
    }

    function getCasterMod(className) {
      if (isFullCaster(className)) {
        return 1;
      } else if (isHalfCaster(className)) {
        return 0.5;
      } else {
        return 0;
      }
    }

    function getPreparedSpells(actor) {
      return actor.items.filter(
        (i) =>
          i.type === 'spell' &&
          i.system.preparation?.prepared &&
          i.system.preparation?.mode === 'prepared'
      );
    }

    function getMaxPrepared(actor) {
      console.log(actor);
      const classes = Object.keys(actor.classes).filter((c) =>
        prepCasters.includes(c)
      );
      console.log(classes);
      let maxPrepNum = 0;

      for (const instance of classes) {
        const castingAbility = getCastingAbility(instance);
        const modifier = actor.system.abilities[castingAbility].mod;
        const classLvl = getClassLvl(instance);
        const casterMod = getCasterMod(instance);

        maxPrepNum += modifier + Math.floor(casterMod * classLvl);
        console.log('maxPrepNum = ' + maxPrepNum);
      }
      return maxPrepNum;
    }

    // The Dialog instance reminding the player to prepare spells
    const content = `
    <form>
      <div class='prep-spells-dialog'>Parece que você completou um descanso longo. Agora você pode preparar as novas magias para o dia.</div>
      <br>
      <div style='text-align: center; font-weight: bold; opacity: 0.5'>Magias Preparadas: ${numPrepared}/${numMaxPrepared}</div>
    </form>
    `;

    const style = `
    <style>
      div.prep-spells-dialog {
        margin-top: 5px;
      }
    
      table.prep-spells-table {
        margin-left: auto;
        margin-right: auto;
      }
    
      .td-level-label {
        padding-left: 5px;
        font-size: 17px;
        font-weight: 500;
        opacity: 0.4;
        position: sticky;
        left: 85%;
        font-variant: all-small-caps;
      }
    
      img.prep-spells-img {
        height: 32px;
        display: block;
        float: left;
        margin-right: 6px;
      }
    
      .td-spell-row.container {
        display: flex;
        align-items: center;
        height: auto;
        padding-left: 5px;
      }
    
      .prep-spells-table th {
        font-size: 20px;
      }
    
    </style>
    `;

    new Dialog({
      title: actor.name,
      content: style + content + (await generateTable(data)),
      buttons: {
        ok: {
          label: 'Abrir Ficha do Personagem',
          icon: '<i class="fas fa-address-book"></i>',
          callback: () => {
            actor.sheet.render(true);
          },
        },
        close: {
          label: 'Fechar',
          icon: `<i class="fas fa-times"></i>`,
          callback: () => {},
        },
      },
    }).render(true, { width: 'auto', height: 'auto' });
  }
});

// This function sorts the spells by level before inserting them into the table
async function sortObj(obj) {
  let sorted = obj.sort((a, b) => a.system.level - b.system.level);
  return sorted;
}

// Generates the table of currently prepared spells
async function generateTable(data) {
  let sortedData = await sortObj(data);
  //console.log(sortedData);
  let table = '<table class="prep-spells-table">';

  table += `
    <tr>
      <th>Lista de Magias Preparadas</th>
    </tr>
  `;
  sortedData.forEach((item) => {
    table += `
      <tr>
        <td class='td-spell' valign:'middle'><div class='td-spell-row container'><img src='${item.img}' class='prep-spells-img'>${item.name} <div class='td-level-label'>Level ${item.system.level}</div></div></td>
      </tr>
    `;
  });

  table += '</table>';

  return table;
}
