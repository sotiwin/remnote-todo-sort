import {
  BuiltInPowerupCodes,
  PowerupSlotCodeMap,
  Rem,
  RichTextElementRemInterface,
  RNPlugin
} from '@remnote/plugin-sdk';
import { getTagProperties, mapRemsToRemsWithDate } from './helper';

export async function onTodoCompleted(plugin: RNPlugin, data: any) {
  const changedRemId = data.remId;
  const changedRem = await plugin.rem.findOne(changedRemId);

  if (changedRem != undefined && await isCompletedTodo(changedRem)) {

    const todoTagName: string = await plugin.settings.getSetting("todoTagName");
    const cadencePropertyName: string = "Cadence"
    const dueDatePropertyName: string = await plugin.settings.getSetting("dueDatePropertyeName");

    let properties = await getTagProperties(plugin, todoTagName, changedRem._id);
    if (properties != undefined) {
      let cadenceProp = properties?.find(
          (props) => props.tagPropertyName == cadencePropertyName)
      if (cadenceProp != undefined && cadenceProp.tagPropertyValueString != "") {
        console.log("cadence", cadenceProp.tagPropertyValueString);
        let dueDateProperty = properties?.find(
            (props) => props.tagPropertyName == dueDatePropertyName)

        if (dueDateProperty != undefined) {
          console.log("dueDate", dueDateProperty);
          let nextDate = calcNextOccurance(dueDateProperty.tagPropertyValueString, cadenceProp.tagPropertyValueString)
          console.log("next", nextDate);
          const nextDateRem = await plugin.date.getDailyDoc(nextDate)
          let valueRichText = {_id: nextDateRem!!._id, i: 'q'} as RichTextElementRemInterface
          await changedRem.setTagPropertyValue(dueDateProperty.tagPropertyRemId, [valueRichText]);
          await changedRem.setTodoStatus('Unfinished');

          await moveSortedByDueDate(plugin, todoTagName, dueDatePropertyName, changedRem, nextDate);

        }

      } else {
        await changedRem.remove()
      }
    }
  }

}

async function isCompletedTodo(rem: Rem): Promise<boolean> {
  const isTodo = await rem.isTodo();
  if (!isTodo) {
    return false;
  }

  const status = await rem.getPowerupProperty(BuiltInPowerupCodes.Todo, "Status")
  if (status != "Finished") {
    return false
  }

  console.log("completed todo:", rem);

  return true;
}

type Unit = 'd' | 'w' | 'm' | 'y';

interface Cadence {
  isFromCompletion: boolean;
  amount: number;
  unit: Unit
}

function calcNextOccurance(dueDateString: string, cadenceExpression: string): Date {
  let cadence = parseCadence(cadenceExpression);
  console.log('cadence', cadence);

  let dueDate = new Date(dueDateString);
  let nowDate = new Date();

  let baseDate = dueDate;
  if (cadence.isFromCompletion) {
    baseDate = nowDate
  }
  let nextDate = new Date();
  switch (cadence.unit) {
    case 'd':
      nextDate = addDays(baseDate, cadence.amount);
      break;
    case 'w':
      nextDate = addWeeks(baseDate, cadence.amount);
      break;
    case 'm':
      nextDate = addMonths(baseDate, cadence.amount);
      break;
    case 'y':
      nextDate = addYears(baseDate, cadence.amount);
      break;
  }

  return nextDate;
}

function parseCadence(expression: string): Cadence {
  const isFromCompletion = expression.startsWith('~');
  if (isFromCompletion) {
    expression = expression.slice(1);
  }
  const unit = expression.slice(expression.length - 1) as Unit;
  expression = expression.slice(0, expression.length - 1)
  const amount = +expression

  return {
    isFromCompletion: isFromCompletion,
    amount: amount,
    unit: unit
  } as Cadence
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addWeeks(date: Date, weeks: number) {
  return addDays(date, 7 * weeks);
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function addYears(date: Date, years: number) {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

async function moveSortedByDueDate(
    plugin: RNPlugin,
    todoTagName: string,
    dueDatePropertyName: string,
    rem: Rem,
    nextDate: Date,
) {
  let parentRem = await rem.getParentRem();
  await rem.setParent(null);
  let siblings = await parentRem?.getChildrenRem();
  if (siblings != null) {
    let remsWithTodoDates = await mapRemsToRemsWithDate(plugin, todoTagName, dueDatePropertyName, siblings);
    let index = remsWithTodoDates.findIndex((rem) => { return rem.dueDate > nextDate.valueOf()})
    if (index != -1) {
      await rem.setParent(parentRem!!, index + 1);
    } else {
      await rem.setParent(parentRem!!, remsWithTodoDates.length + 1);
    }
  }
}
