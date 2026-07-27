@extends('frontend.layouts.app')

@section('content')
    <section class="gry-bg py-4 profile">
        <div class="container">
            <div class="row cols-xs-space cols-sm-space cols-md-space">
                <div class="col-lg-3 d-none d-lg-block">
                    @if(Auth::user()->user_type == 'seller')
                        @include('frontend.inc.seller_side_nav')
                    @elseif(Auth::user()->user_type == 'customer')
                        @include('frontend.inc.customer_side_nav')
                    @endif
                </div>

                <div class="col-lg-9">
                    <div class="main-content">
                        <!-- Page title -->
                        <div class="page-title">
                            <div class="row align-items-center">
                                <div class="col-md-6 col-12 d-flex align-items-center">
                                    <h2 class="heading heading-6 text-capitalize strong-600 mb-0">
                                        {{translate('Affiliate')}}
                                    </h2>
                                </div>
                                <div class="col-md-6 col-12">
                                    <div class="float-md-right">
                                        <ul class="breadcrumb">
                                            <li><a href="{{ route('home') }}">{{translate('Home')}}</a></li>
                                            <li><a href="{{ route('dashboard') }}">{{translate('Dashboard')}}</a></li>
                                            <li class="active"><a href="{{ route('affiliate.user.index') }}">{{translate('Affiliate System')}}</a></li>
                                        </ul>
                                        <br>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-4">
                                <div class="dashboard-widget text-center green-widget text-white mt-4 c-pointer">
                                    <i class="fa fa-dollar"></i>
                                    <span class="d-block title heading-3 strong-400">{{ single_price(Auth::user()->affiliate_user->balance) }}</span>
                                    <span class="d-block sub-title">{{ translate('Affiliate Balance') }}</span>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <a href="{{ route('affiliate.payment_settings') }}">
                                    <div class="dashboard-widget text-center plus-widget mt-4 c-pointer">
                                        <i class="la la-cog"></i>
                                        <span class="d-block title heading-6 strong-400 c-base-1">{{ translate('Configure Payout') }}</span>
                                    </div>
                                </a>
                            </div>
                            <div class="col-md-4">
                                <div class="dashboard-widget text-center plus-widget mt-4 c-pointer" onclick="show_affiliate_withdraw_modal()">
                                    <i class="la la-plus"></i>
                                    <span class="d-block title heading-6 strong-400 c-base-1">{{  translate('Affiliate Withdraw Request') }}</span>
                                </div>
                            </div>
                        </div>

                        @if (\App\Addon::where('unique_identifier', 'affiliate_system')->first() != null && \App\Addon::where('unique_identifier', 'affiliate_system')->first()->activated && \App\AffiliateOption::where('type', 'user_registration_first_purchase')->first()->status)
                            <div class="row">
                                @php
                                    if(Auth::user()->referral_code == null){
                                        Auth::user()->referral_code = substr(Auth::user()->id.Str::random(), 0, 10);
                                        Auth::user()->save();
                                    }
                                    $referral_code = Auth::user()->referral_code;
                                    $referral_code_url = URL::to('/users/registration')."?referral_code=$referral_code";
                                @endphp
                                <div class="col">
                                    <div class="form-box bg-white mt-4">
                                        <div class="form-box-content p-3">
                                            <div class="form-group">
                                                    <textarea id="referral_code_url" class="form-control"
                                                              readonly type="text" >{{$referral_code_url}}</textarea>
                                            </div>
                                            <button type=button id="ref-cpurl-btn" class="btn btn-base-1"
                                                    data-attrcpy="{{translate('Copied')}}"
                                                    onclick="copyToClipboard('url')" >{{translate('Copy Url')}}</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        @endif

                        <div class="row">
                            <div class="col-md-6">
                                <div class="card no-border mt-5">
                                    <div class="card-header py-3">
                                        <h4 class="mb-0 h6">{{translate('Affiliate payment history')}}</h4>
                                    </div>
                                    <div class="card-body">
                                        <table class="table table-sm table-responsive-md mb-0">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>{{ translate('Date') }}</th>
                                                    <th>{{translate('Amount')}}</th>
                                                    <th>{{translate('Payment Method')}}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                @if(count($affiliate_payments) > 0)
                                                    @foreach ($affiliate_payments as $key => $affiliate_payment)
                                                        <tr>
                                                            <td>{{ $key+1 }}</td>
                                                            <td>{{ date('d-m-Y', strtotime($affiliate_payment->created_at)) }}</td>
                                                            <td>{{ single_price($affiliate_payment->amount) }}</td>
                                                            <td>{{ ucfirst(str_replace('_', ' ', $affiliate_payment ->payment_method)) }}</td>
                                                        </tr>
                                                    @endforeach
                                                @else
                                                    <tr>
                                                        <td class="text-center pt-5 h4" colspan="100%">
                                                            <i class="la la-meh-o d-block heading-1 alpha-5"></i>
                                                        <span class="d-block">{{ translate('No history found.') }}</span>
                                                        </td>
                                                    </tr>
                                                @endif
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div class="pagination-wrapper py-4">
                                    <ul class="pagination justify-content-end">
                                        {{ $affiliate_payments->links() }}
                                    </ul>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card no-border mt-5">
                                    <div class="card-header py-3">
                                        <h4 class="mb-0 h6">{{ translate('Affiliate withdraw request history')}}</h4>
                                    </div>
                                    <div class="card-body">
                                        <table class="table table-sm table-responsive-md mb-0">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>{{ translate('Date') }}</th>
                                                    <th>{{ translate('Amount')}}</th>
                                                    <th>{{ translate('Status')}}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                @if(count($affiliate_withdraw_requests) > 0)
                                                    @foreach ($affiliate_withdraw_requests as $key => $affiliate_withdraw_request)
                                                        <tr>
                                                            <td>{{ $key+1 }}</td>
                                                            <td>{{ date('d-m-Y', strtotime($affiliate_withdraw_request->created_at)) }}</td>
                                                            <td>{{ single_price($affiliate_withdraw_request->amount) }}</td>
                                                            <td>
                                                                <span class="badge badge--2 mr-4">
                                                                    @if($affiliate_withdraw_request->status == 1)
                                                                        <i class="bg-green"></i> {{ translate('Approved') }}
                                                                    @elseif($affiliate_withdraw_request->status == 2)
                                                                        <i class="bg-red"></i> {{ translate('Rejected') }}
                                                                    @else
                                                                        <i class="bg-blue"></i> {{ translate('Pending') }}
                                                                    @endif
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    @endforeach
                                                @else
                                                    <tr>
                                                        <td class="text-center pt-5 h4" colspan="100%">
                                                            <i class="la la-meh-o d-block heading-1 alpha-5"></i>
                                                        <span class="d-block">{{ translate('No history found.') }}</span>
                                                        </td>
                                                    </tr>
                                                @endif
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div class="pagination-wrapper py-4">
                                    <ul class="pagination justify-content-end">
                                        {{ $affiliate_withdraw_requests->links() }}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <div class="modal fade" id="affiliate_withdraw_modal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-zoom product-modal" id="modal-size" role="document">
            <div class="modal-content position-relative">
                <div class="modal-header">
                    <h5 class="modal-title strong-600 heading-5">{{ translate('Affiliate Withdraw Request')}}</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form class="" action="{{ route('affiliate.withdraw_request.store') }}" method="post">
                    @csrf
                    <div class="modal-body gry-bg px-3 pt-3">
                        <div class="row">
                            <div class="col-md-3">
                                <label>{{ translate('Amount')}} <span class="required-star">*</span></label>
                            </div>
                            <div class="col-md-9">
                                <input type="number" class="form-control mb-3" name="amount" min="1" max="{{ Auth::user()->affiliate_user->balance }}" placeholder="{{ translate('Amount')}}" required>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" class="btn btn-base-1">{{ translate('Confirm')}}</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

@endsection


@section('script')
    <script>
        function copyToClipboard(btn){
            // var el_code = document.getElementById('referral_code');
            var el_url = document.getElementById('referral_code_url');
            // var c_b = document.getElementById('ref-cp-btn');
            var c_u_b = document.getElementById('ref-cpurl-btn');

            // if(btn == 'code'){
            //     if(el_code != null && c_b != null){
            //         el_code.select();
            //         document.execCommand('copy');
            //         c_b .innerHTML  = c_b.dataset.attrcpy;
            //     }
            // }

            if(btn == 'url'){
                if(el_url != null && c_u_b != null){
                    el_url.select();
                    document.execCommand('copy');
                    c_u_b .innerHTML  = c_u_b.dataset.attrcpy;
                }
            }
        }

        function show_affiliate_withdraw_modal(){
            $('#affiliate_withdraw_modal').modal('show');
        }
    </script>
@endsection
