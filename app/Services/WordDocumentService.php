<?php

namespace App\Services;

use RuntimeException;
use ZipArchive;

class WordDocumentService
{
    /**
     * Generate 2-page Word (.docx) document merging STNK and/or PAJAK.
     *
     * @param  string|null  $stnkFrontPngBinary   Raw binary string of rendered STNK output
     * @param  string|null  $pajakFrontPngBinary  Raw binary string of rendered PAJAK output
     * @param  string|null  $stnkBackPngPath      File path to STNK belakang.png
     * @param  string|null  $pajakBackPngPath     File path to PAJAK belakang.png
     * @return string Binary content of the generated .docx file
     */
    public function generateDocx(
        ?string $stnkFrontPngBinary,
        ?string $pajakFrontPngBinary,
        ?string $stnkBackPngPath = null,
        ?string $pajakBackPngPath = null
    ): string {
        $stnkBackPngPath = $stnkBackPngPath ?? public_path('images/STNK/belakang.png');
        $pajakBackPngPath = $pajakBackPngPath ?? public_path('images/PAJAK/belakang.png');

        if (! file_exists($pajakBackPngPath)) {
            $pajakBackPngPath = public_path('images/pajak/belakang.png');
        }

        $tempPath = tempnam(sys_get_temp_dir(), 'docx_merge_');
        $zip = new ZipArchive();
        if ($zip->open($tempPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new RuntimeException("Cannot create temporary docx archive at {$tempPath}");
        }

        // 1. [Content_Types].xml
        $contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Default Extension="png" ContentType="image/png"/>
    <Default Extension="jpeg" ContentType="image/jpeg"/>
    <Default Extension="jpg" ContentType="image/jpeg"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>';
        $zip->addFromString('[Content_Types].xml', $contentTypes);

        // 2. _rels/.rels
        $rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>';
        $zip->addFromString('_rels/.rels', $rootRels);

        // 3. Media & Relationships
        $relsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';

        $relIndex = 1;
        $imageRels = [];

        // Halaman 1: Belakang STNK
        if ($stnkFrontPngBinary !== null && file_exists($stnkBackPngPath)) {
            $rId = 'rId'.($relIndex++);
            $imageRels['stnk_back'] = $rId;
            $zip->addFile($stnkBackPngPath, 'word/media/stnk_back.png');
            $relsXml .= '<Relationship Id="'.$rId.'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/stnk_back.png"/>';
        }

        // Halaman 1: Belakang PAJAK
        if ($pajakFrontPngBinary !== null && file_exists($pajakBackPngPath)) {
            $rId = 'rId'.($relIndex++);
            $imageRels['pajak_back'] = $rId;
            $zip->addFile($pajakBackPngPath, 'word/media/pajak_back.png');
            $relsXml .= '<Relationship Id="'.$rId.'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/pajak_back.png"/>';
        }

        // Halaman 2: Output STNK
        if ($stnkFrontPngBinary !== null) {
            $rId = 'rId'.($relIndex++);
            $imageRels['stnk_front'] = $rId;
            $zip->addFromString('word/media/stnk_front.png', $stnkFrontPngBinary);
            $relsXml .= '<Relationship Id="'.$rId.'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/stnk_front.png"/>';
        }

        // Halaman 2: Output PAJAK
        if ($pajakFrontPngBinary !== null) {
            $rId = 'rId'.($relIndex++);
            $imageRels['pajak_front'] = $rId;
            $zip->addFromString('word/media/pajak_front.png', $pajakFrontPngBinary);
            $relsXml .= '<Relationship Id="'.$rId.'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/pajak_front.png"/>';
        }

        $relsXml .= '</Relationships>';
        $zip->addFromString('word/_rels/document.xml.rels', $relsXml);

        // Helper drawing anchor
        $buildAnchor = function (
            int $docPrId,
            string $docPrName,
            string $rId,
            int $cxEmus,
            int $cyEmus,
            string $horizRel,
            int $horizOffsetEmus,
            string $vertRel,
            int $vertOffsetEmus
        ): string {
            return '
            <w:r>
                <w:drawing>
                    <wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="251658240" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1">
                        <wp:simplePos x="0" y="0"/>
                        <wp:positionH relativeFrom="'.$horizRel.'">
                            <wp:posOffset>'.$horizOffsetEmus.'</wp:posOffset>
                        </wp:positionH>
                        <wp:positionV relativeFrom="'.$vertRel.'">
                            <wp:posOffset>'.$vertOffsetEmus.'</wp:posOffset>
                        </wp:positionV>
                        <wp:extent cx="'.$cxEmus.'" cy="'.$cyEmus.'"/>
                        <wp:effectExtent l="0" t="0" r="0" b="0"/>
                        <wp:wrapNone/>
                        <wp:docPr id="'.$docPrId.'" name="'.$docPrName.'"/>
                        <wp:cNvGraphicFramePr>
                            <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
                        </wp:cNvGraphicFramePr>
                        <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
                            <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                                <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                                    <pic:nvPicPr>
                                        <pic:cNvPr id="'.$docPrId.'" name="'.$docPrName.'"/>
                                        <pic:cNvPicPr>
                                            <a:picLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
                                        </pic:cNvPicPr>
                                    </pic:nvPicPr>
                                    <pic:blipFill>
                                        <a:blip r:embed="'.$rId.'" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
                                        <a:stretch>
                                            <a:fillRect/>
                                        </a:stretch>
                                    </pic:blipFill>
                                    <pic:spPr>
                                        <a:xfrm>
                                            <a:off x="0" y="0"/>
                                            <a:ext cx="'.$cxEmus.'" cy="'.$cyEmus.'"/>
                                        </a:xfrm>
                                        <a:prstGeom prst="rect">
                                            <a:avLst/>
                                        </a:prstGeom>
                                    </pic:spPr>
                                </pic:pic>
                            </a:graphicData>
                        </a:graphic>
                    </wp:anchor>
                </w:drawing>
            </w:r>';
        };

        // Dimensions in EMUs:
        // Height requested = 7.6 cm (2,736,000 EMUs) with locked aspect ratio
        // STNK: 2720 x 924 -> ratio = 2.943723 -> Width = 22.372294 cm (8,054,026 EMUs), Height = 7.6 cm (2,736,000 EMUs)
        $stnkCx = 8054026;
        $stnkCy = 2736000;

        // PAJAK: 2644 x 928 -> ratio = 2.849138 -> Width = 21.653448 cm (7,795,241 EMUs), Height = 7.6 cm (2,736,000 EMUs)
        $pajakCx = 7795241;
        $pajakCy = 2736000;

        // ── HALAMAN 1 (Belakang) ─────────────────────────────────────────────
        $page1Content = '<w:p>';
        $docId = 1;

        // Belakang STNK:
        // Horiz: 1.27 cm (457200 EMUs) right of column
        // Vert: 0 cm (0 EMUs) below paragraph
        if (isset($imageRels['stnk_back'])) {
            $page1Content .= $buildAnchor(
                $docId++,
                'Belakang STNK',
                $imageRels['stnk_back'],
                $stnkCx,
                $stnkCy,
                'column',
                457200,     // 1.27 cm
                'paragraph',
                0           // 0 cm
            );
        }

        // Belakang PAJAK:
        // Horiz: 2 cm (720000 EMUs) right of column
        // Vert: 9.53 cm (3430800 EMUs) below paragraph
        if (isset($imageRels['pajak_back'])) {
            $page1Content .= $buildAnchor(
                $docId++,
                'Belakang PAJAK',
                $imageRels['pajak_back'],
                $pajakCx,
                $pajakCy,
                'column',
                720000,     // 2 cm
                'paragraph',
                3430800     // 9.53 cm
            );
        }
        $page1Content .= '</w:p>';

        // ── PAGE BREAK ───────────────────────────────────────────────────────
        $pageBreak = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';

        // ── HALAMAN 2 (Output / Depan) ───────────────────────────────────────
        $page2Content = '<w:p>';

        // Output STNK:
        // Horiz: 3.51 cm (1263600 EMUs) right of column
        // Vert: 1.28 cm (460800 EMUs) below page
        if (isset($imageRels['stnk_front'])) {
            $page2Content .= $buildAnchor(
                $docId++,
                'Output STNK',
                $imageRels['stnk_front'],
                $stnkCx,
                $stnkCy,
                'column',
                1263600,    // 3.51 cm
                'page',
                460800      // 1.28 cm
            );
        }

        // Output PAJAK:
        // Horiz: 3.51 cm (1263600 EMUs) right of column
        // Vert: 11.54 cm (4154400 EMUs) below page
        if (isset($imageRels['pajak_front'])) {
            $page2Content .= $buildAnchor(
                $docId++,
                'Output PAJAK',
                $imageRels['pajak_front'],
                $pajakCx,
                $pajakCy,
                'column',
                1263600,    // 3.51 cm
                'page',
                4154400     // 11.54 cm
            );
        }
        $page2Content .= '</w:p>';

        // Document section properties: A4 Landscape (29.7 cm x 21.0 cm) + Margin Narrow (1.27 cm = 720 twips)
        // A4 Landscape: w = 16838 twips (29.7 cm), h = 11906 twips (21.0 cm)
        $sectPr = '<w:sectPr>
            <w:pgSz w:w="16838" w:h="11906" w:orient="landscape" w:code="9"/>
            <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="720" w:footer="720" w:gutter="0"/>
            <w:cols w:space="720"/>
            <w:docGrid w:linePitch="360"/>
        </w:sectPr>';

        $documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
            xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
    <w:body>
        '.$page1Content.'
        '.$pageBreak.'
        '.$page2Content.'
        '.$sectPr.'
    </w:body>
</w:document>';

        $zip->addFromString('word/document.xml', $documentXml);
        $zip->close();

        $binary = (string) file_get_contents($tempPath);
        @unlink($tempPath);

        return $binary;
    }
}
