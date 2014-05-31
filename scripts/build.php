<?php
chdir(realpath(dirname(__FILE__)));
$build = file_get_contents('../build.json');
$inputHtml = file_get_contents('../server/views/index.html');
$build = json_decode($build, true);
foreach (array('development', 'production')  as $env) {
    $output = $build[$env];
    foreach (array('css', 'js') as $type) {
        if (!array_key_exists($type, $output)) {
            $output[$type] = $build['default'][$type];
        }
    }
    $outputHtml = str_replace('[ INSERT LAZYLOAD SCRIPT URL HERE ]', $output['js']['lazyload'], $inputHtml);
    $outputHtml = str_replace('[ INSERT BUILD OBJECT HERE ]', json_encode($output), $outputHtml);
    $fp = fopen("../server/views/index.{$env}.html", 'w');
    fwrite($fp, $outputHtml);
    fclose($fp);
}