// Buat Survei Baru (PRD §8.2) — satu komponen, dua state (blank / duplicate).
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/Modal';
import { FormField } from '@/components/FormField';
import { RadioCard } from '@/components/RadioCard';
import { useSurveyStore } from '@/store/useSurveyStore';
import { createSurvey } from '@/data/surveys';
import type { JenisNota } from '@/types';

const PERIODE_OPTIONS = [2026, 2027, 2028, 2029];
const JENIS: JenisNota[] = ['Domestik', 'Internasional', 'SPSL Group'];

const schema = z
  .object({
    method: z.enum(['blank', 'duplicate']),
    sourceKode: z.string().optional(),
    nama: z.string().min(1, 'Nama survei wajib diisi'),
    kode: z.string().min(1, 'Kode survei wajib diisi'),
    periode: z.coerce.number().int(),
    jenisNota: z.enum(['Domestik', 'Internasional', 'SPSL Group']),
    tanggalMulai: z.string().min(1, 'Tanggal mulai wajib diisi'),
    tanggalSelesai: z.string().min(1, 'Tanggal selesai wajib diisi'),
    deskripsi: z.string().optional(),
  })
  .refine((d) => d.method !== 'duplicate' || !!d.sourceKode, {
    message: 'Pilih survei sumber',
    path: ['sourceKode'],
  });

type FormValues = z.infer<typeof schema>;

export function CreateSurveyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const surveys = useSurveyStore((s) => s.surveys);
  const kodeTouched = useRef(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      method: 'blank',
      sourceKode: '',
      nama: '',
      kode: 'SKP-2027',
      periode: 2027,
      jenisNota: 'Domestik',
      tanggalMulai: '',
      tanggalSelesai: '',
      deskripsi: '',
    },
  });

  const method = watch('method');
  const periode = watch('periode');

  // Kode otomatis dari tahun selama belum diubah manual (§6.1).
  useEffect(() => {
    if (!kodeTouched.current) setValue('kode', `SKP-${periode}`);
  }, [periode, setValue]);

  useEffect(() => {
    if (open) {
      kodeTouched.current = false;
      reset();
    }
  }, [open, reset]);

  const onSubmit = (values: FormValues) => {
    const survey = createSurvey({
      method: values.method,
      sourceKode: values.method === 'duplicate' ? values.sourceKode : undefined,
      nama: values.nama,
      kode: values.kode,
      periode: values.periode,
      jenisNota: values.jenisNota,
      tanggalMulai: values.tanggalMulai,
      tanggalSelesai: values.tanggalSelesai,
      deskripsi: values.deskripsi,
    });
    onClose();
    navigate(`/surveys/${survey.id}/questions`, {
      state: { justCreated: true, fromKode: survey.duplicatedFrom },
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buat survei baru"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button type="submit" form="create-survey-form" className="btn-primary">
            Buat survei
          </button>
        </>
      }
    >
      <form id="create-survey-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <p className="mb-2 text-label-md uppercase text-text-secondary">Metode pembuatan</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RadioCard
              selected={method === 'blank'}
              onSelect={() => setValue('method', 'blank')}
              icon="description"
              title="Mulai dari kosong"
              desc="Susun struktur pertanyaan dari nol"
            />
            <RadioCard
              selected={method === 'duplicate'}
              onSelect={() => setValue('method', 'duplicate')}
              icon="content_copy"
              title="Duplikat dari survei lain"
              desc="Salin pertanyaan & skala dari survei yang sudah ada"
            />
          </div>
        </div>

        {method === 'duplicate' && (
          <FormField label="Salin dari" htmlFor="sourceKode" required error={errors.sourceKode?.message}>
            <select id="sourceKode" className="input" {...register('sourceKode')}>
              <option value="">Pilih survei sumber...</option>
              {surveys.map((s) => (
                <option key={s.id} value={s.kode}>
                  {s.kode} — {s.nama}
                </option>
              ))}
            </select>
          </FormField>
        )}

        <FormField label="Nama survei" htmlFor="nama" required error={errors.nama?.message}>
          <input id="nama" className="input" placeholder="Mis. Survei Kepuasan Pelanggan 2027" {...register('nama')} />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Kode survei"
            htmlFor="kode"
            required
            helper="Dibuat otomatis dari tahun, bisa diubah"
            error={errors.kode?.message}
          >
            <input
              id="kode"
              className="input font-mono"
              {...register('kode', { onChange: () => (kodeTouched.current = true) })}
            />
          </FormField>

          <FormField label="Periode (tahun)" htmlFor="periode" required>
            <select id="periode" className="input" {...register('periode', { valueAsNumber: true })}>
              {PERIODE_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Jenis nota" htmlFor="jenisNota" required>
            <select id="jenisNota" className="input" {...register('jenisNota')}>
              {JENIS.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Status awal" helper="Survei dimulai sebagai draft">
            <div className="flex h-10 items-center">
              <span className="rounded-full bg-[#FFF7ED] px-2.5 py-1 text-body-sm font-medium text-[#C2410C]">
                Draft
              </span>
            </div>
          </FormField>

          <FormField label="Tanggal mulai" htmlFor="tanggalMulai" required error={errors.tanggalMulai?.message}>
            <input id="tanggalMulai" type="date" className="input" {...register('tanggalMulai')} />
          </FormField>

          <FormField label="Tanggal selesai" htmlFor="tanggalSelesai" required error={errors.tanggalSelesai?.message}>
            <input id="tanggalSelesai" type="date" className="input" {...register('tanggalSelesai')} />
          </FormField>
        </div>

        <FormField label="Deskripsi (opsional)" htmlFor="deskripsi">
          <textarea
            id="deskripsi"
            rows={3}
            className="input h-auto py-2"
            placeholder="Catatan internal tentang survei ini..."
            {...register('deskripsi')}
          />
        </FormField>
      </form>
    </Modal>
  );
}
