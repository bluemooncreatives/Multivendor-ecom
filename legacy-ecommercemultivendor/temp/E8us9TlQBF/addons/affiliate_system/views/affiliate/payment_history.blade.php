@extends('layouts.app')

@section('content')

<!-- Basic Data Tables -->
<!--===================================================-->
<div class="panel">
    <div class="panel-heading">
        <h3 class="panel-title">{{ translate('Affiliate payments of ').$affiliate_user->user->name }}</h3>
    </div>
    <div class="panel-body">
        <table class="table table-striped table-bordered demo-dt-basic" cellspacing="0" width="100%">
            <thead>
                <tr>
                    <th>#</th>
                    <th>{{ translate('Date')}}</th>
                    <th>{{ translate('Amount')}}</th>
                    <th>{{ translate('Payment Method') }}</th>
                </tr>
            </thead>
            <tbody>
                @foreach($affiliate_payments as $key => $payment)
                    <tr>
                        <td>{{ $key+1 }}</td>
                        <td>{{ $payment->created_at }}</td>
                        <td>
                            {{ single_price($payment->amount) }}
                        </td>
                        <td>{{ ucfirst($payment->payment_method) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

    </div>
</div>

@endsection
