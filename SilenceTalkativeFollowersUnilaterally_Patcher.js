// To use this, select all plugins that need patches and run this script.
// A new, ESL-flagged patch plugin for each selected plugin will be created.
// Every idle line in a topic flagged with the "IDLE" type will be overridden
// with a single condition added to front of its condition list. This condition
// uses a flag set by FECKOFF.esp that is set when either:
// * The player is in conversation with an NPC.
// * One of the player's other followers is talking.

let nodes = zedit.GetSelectedNodes()
nodes.forEach(node => {
  patchPlugin(node.handle);
});

function patchPlugin(plugin) {
  let patchPlugin = createPatchPlugin(plugin);
  
  let topics = xelib.GetElements(plugin, 'Dialog Topic', false);
  topics.forEach(topic => {
    let type = xelib.GetValue(topic, 'SNAM');
    if (type === 'IDLE') {
      copyAndPatchIdles(topic, patchPlugin);
    }
  });

  xelib.CleanMasters(patchPlugin);
}

function createPatchPlugin(plugin) {
  let pluginName = xelib.GetFileName(plugin);
  let pluginNameNoExt = pluginName.replace(/\.[^/.]+$/, "");
  let patchPluginName = 'SuppressionOfSpeech_' + pluginNameNoExt + '.esp';
  let patchPlugin = xelib.AddFile(patchPluginName);

  let masters = [
    'Skyrim.esm',
    'Update.esm',
    'Dawnguard.esm',
    'HearthFires.esm',
    'Dragonborn.esm',
    'FECKOFF.esp',
    pluginName
  ];
  masters.forEach(master => {
    xelib.AddMaster(patchPlugin, master);
  });
  
  let header = xelib.GetFileHeader(patchPlugin);
  xelib.SetRecordFlag(header, 'ESL', true);

  return patchPlugin;
}

function copyAndPatchIdles(topic, patchPlugin) {
  zedit.log('Copying idles in topic: ' + xelib.GetValue(topic, 'EDID'));
  let infoRecords = xelib.GetRecords(topic, 'INFO');
  infoRecords.forEach(info => {
    let override = xelib.CopyElement(info, patchPlugin, false);
    createCondition(override);
  });
}

function createCondition(topicInfo) {
  // Dialogue is not currently running...
  let condition = xelib.AddArrayItem(topicInfo, 'Conditions');
  xelib.SetValue(condition, 'CTDA\\Type', '10010000'); // equals, AND
  xelib.SetValue(condition, 'CTDA\\Function', 'GetGlobalValue');
  xelib.SetValue(condition, 'CTDA\\Comparison Value', '0.0');
  xelib.SetValue(condition, 'CTDA\\Parameter #1', 'FK_GLOB_DialogueIsOngoing');
  xelib.SetValue(condition, 'CTDA\\Run On', 'Subject');
  xelib.MoveArrayItem(condition, 0);
  // A nearby scene is not currently running...
  condition = xelib.AddArrayItem(topicInfo, 'Conditions');
  xelib.SetValue(condition, 'CTDA\\Type', '10000000'); // equals, AND
  xelib.SetValue(condition, 'CTDA\\Function', 'GetGlobalValue');
  xelib.SetValue(condition, 'CTDA\\Comparison Value', '0.0');
  xelib.SetValue(condition, 'CTDA\\Parameter #1', 'FK_GLOB_SceneIsOngoing');
  xelib.SetValue(condition, 'CTDA\\Run On', 'Subject');
  xelib.MoveArrayItem(condition, 1);
}
