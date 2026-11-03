<?php

namespace Database\Seeders;

use App\Models\AiSummary;
use App\Models\Lesson;
use App\Models\LessonFile;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database with working demo data.
     */
    public function run(): void
    {
        $teacher = User::create([
            'name' => 'Dr. Elena Ross',
            'email' => 'teacher@classcatch.com',
            'password' => Hash::make('password'),
            'role' => 'teacher',
        ]);

        $student = User::create([
            'name' => 'Alex Chen',
            'email' => 'student@classcatch.com',
            'password' => Hash::make('password'),
            'role' => 'student',
        ]);

        $secondStudent = User::create([
            'name' => 'Jordan Lee',
            'email' => 'student2@classcatch.com',
            'password' => Hash::make('password'),
            'role' => 'student',
        ]);

        $physics = SchoolClass::create([
            'teacher_id' => $teacher->id,
            'name' => 'Advanced Physics 101',
            'description' => 'Introduction to quantum mechanics and thermodynamics.',
            'code' => 'PHYS101',
        ]);

        $chemistry = SchoolClass::create([
            'teacher_id' => $teacher->id,
            'name' => 'Organic Chemistry',
            'description' => 'Reaction mechanisms and molecular structures.',
            'code' => 'CHEM201',
        ]);

        $student->classMemberships()->create(['class_id' => $physics->id]);
        $student->classMemberships()->create(['class_id' => $chemistry->id]);
        $secondStudent->classMemberships()->create(['class_id' => $chemistry->id]);

        $physics->update(['representative_id' => $student->id]);

        $thermodynamics = Lesson::create([
            'class_id' => $physics->id,
            'teacher_id' => $teacher->id,
            'title' => 'The First Law of Thermodynamics',
            'description' => 'Energy conservation, internal energy, and heat transfer.',
        ]);

        Lesson::create([
            'class_id' => $physics->id,
            'teacher_id' => $teacher->id,
            'title' => 'Entropy and the Second Law',
            'description' => 'Disorder, heat engines, and irreversible processes.',
        ]);

        Lesson::create([
            'class_id' => $chemistry->id,
            'teacher_id' => $teacher->id,
            'title' => 'Introduction to Reaction Mechanisms',
            'description' => 'Nucleophiles, electrophiles, and curly-arrow notation.',
        ]);

        // A real, readable PDF material so AI summaries can be generated out of the box.
        $materialPath = 'lesson-materials/thermodynamics-notes.pdf';
        $this->writeDemoPdf(
            Storage::disk('public')->path($materialPath),
            'Thermodynamics is the branch of physics that deals with heat, work and temperature. '
            . 'The first law states that energy cannot be created or destroyed in an isolated system; '
            . 'it can only change forms. The second law introduces entropy: the total entropy of an '
            . 'isolated system can never decrease over time. Heat engines convert thermal energy into '
            . 'mechanical work, and their efficiency is bounded by the Carnot cycle. The third law '
            . 'states that as temperature approaches absolute zero, entropy approaches a constant minimum.'
        );

        LessonFile::create([
            'lesson_id' => $thermodynamics->id,
            'uploaded_by' => $teacher->id,
            'type' => 'material',
            'original_name' => 'thermodynamics-notes.pdf',
            'path' => $materialPath,
            'mime_type' => 'application/pdf',
            'size' => filesize(Storage::disk('public')->path($materialPath)),
        ]);

        AiSummary::create([
            'lesson_id' => $thermodynamics->id,
            'lesson_file_id' => null,
            'type' => 'summary',
            'content' => "# Lesson Summary: The First Law of Thermodynamics\n\n"
                . "## Overview\nThermodynamics studies how heat, work and temperature relate to energy and matter.\n\n"
                . "## Key Concepts\n- **First Law:** Energy cannot be created or destroyed, only transferred or converted.\n"
                . "- **Internal Energy:** Changes equal heat added to the system minus work done by the system.\n"
                . "- **Second Law:** The entropy of an isolated system never decreases.\n\n"
                . "## Takeaways\n1. Total energy in an isolated system is constant.\n"
                . '2. Heat engines are bounded by the Carnot efficiency.',
        ]);

        // A real demo whiteboard image plus a stored explanation for the student lesson view.
        $photoPath = 'classroom-photos/thermodynamics-whiteboard.png';
        $this->writeDemoImage(Storage::disk('public')->path($photoPath));

        $photo = LessonFile::create([
            'lesson_id' => $thermodynamics->id,
            'uploaded_by' => $student->id,
            'type' => 'photo',
            'original_name' => 'thermodynamics-whiteboard.png',
            'path' => $photoPath,
            'mime_type' => 'image/png',
            'size' => filesize(Storage::disk('public')->path($photoPath)),
        ]);

        AiSummary::create([
            'lesson_id' => $thermodynamics->id,
            'lesson_file_id' => $photo->id,
            'type' => 'explanation',
            'content' => "This whiteboard shows a simple energy-flow diagram from today's lesson. "
                . "The blue box represents the system (for example, a gas in a cylinder), and the orange "
                . "box represents the surroundings. The arrow between them illustrates energy being "
                . "transferred as heat or work, which is exactly what the first law of thermodynamics "
                . 'describes: energy is conserved, only its form changes.',
        ]);
    }

    /** Write a minimal but valid PDF containing selectable text. */
    private function writeDemoPdf(string $path, string $text): void
    {
        $lines = explode("\n", wordwrap($text, 80, "\n", true));
        $content = "BT\n/F1 12 Tf\n50 750 Td\n14 TL\n";

        foreach ($lines as $line) {
            $escaped = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $line);
            $content .= "($escaped) Tj\nT*\n";
        }

        $content .= "ET\n";

        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
            '<< /Length '.strlen($content)." >>\nstream\n".$content.'endstream',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [];

        foreach ($objects as $index => $object) {
            $offsets[] = strlen($pdf);
            $pdf .= ($index + 1)." 0 obj\n".$object."\nendobj\n";
        }

        $xrefOffset = strlen($pdf);
        $count = count($objects) + 1;
        $pdf .= "xref\n0 ".$count."\n0000000000 65535 f \n";

        foreach ($offsets as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }

        $pdf .= "trailer\n<< /Size ".$count." /Root 1 0 R >>\nstartxref\n".$xrefOffset."\n%%EOF";

        $this->ensureDirectory($path);
        file_put_contents($path, $pdf);
    }

    /** Write a small PNG image of a whiteboard-style diagram without requiring GD. */
    private function writeDemoImage(string $path): void
    {
        $width = 480;
        $height = 300;
        $rows = '';

        for ($y = 0; $y < $height; $y++) {
            $rows .= "\x00";

            for ($x = 0; $x < $width; $x++) {
                [$r, $g, $b] = [250, 250, 245];

                if ($x < 10 || $x >= $width - 10 || $y < 10 || $y >= $height - 10) {
                    [$r, $g, $b] = [30, 30, 30];
                } elseif ($x > 50 && $x < 200 && $y > 80 && $y < 210) {
                    [$r, $g, $b] = [70, 130, 210];
                } elseif ($x > 280 && $x < 430 && $y > 80 && $y < 210) {
                    [$r, $g, $b] = [240, 165, 60];
                } elseif ($y > 140 && $y < 150 && $x > 200 && $x < 280) {
                    [$r, $g, $b] = [30, 30, 30];
                }

                $rows .= chr($r).chr($g).chr($b);
            }
        }

        $ihdr = pack('NNCCCCC', $width, $height, 8, 2, 0, 0, 0);
        $idat = gzcompress($rows, 9);

        $png = "\x89PNG\r\n\x1a\n";

        foreach ([['IHDR', $ihdr], ['IDAT', $idat], ['IEND', '']] as [$type, $data]) {
            $chunk = $type.$data;
            $png .= pack('N', strlen($data)).$chunk.pack('N', crc32($chunk));
        }

        $this->ensureDirectory($path);
        file_put_contents($path, $png);
    }

    private function ensureDirectory(string $path): void
    {
        if (! is_dir(dirname($path))) {
            mkdir(dirname($path), 0777, true);
        }
    }
}
